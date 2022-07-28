import fetch from "node-fetch";
import { config } from "dotenv";
import simpleGit from "simple-git";
config();

const contributionCommitMessage = 'history: has contributed to a private repo.'

async function getContributions(token, username) {
    const headers = {
        'Authorization': `bearer ${token}`,
    }
    const body = {
        "query": `query {
            user(login: "${username}") {
              name
              contributionsCollection {
                contributionCalendar {
                  colors
                  totalContributions
                  weeks {
                    contributionDays {
                      color
                      contributionCount
                      date
                      weekday
                    }
                    firstDay
                  }
                }
              }
            }
          }`
    }
    const response = await fetch(process.env.COMPANY, { method: 'POST', body: JSON.stringify(body), headers: headers })
    const data = await response.json()
    return data
}

async function main() {
    const git = simpleGit();
    const gitLog = await git.log();
    const lastCommitDate = gitLog?.all.find(c => c.message === contributionCommitMessage)?.date;
    const lastCommitDateMs = lastCommitDate ? Date.parse(lastCommitDate) : 0;

    const res = await getContributions(process.env.TOKEN, process.env.USERNAME)
    const contributionsPerWeek = res?.data?.user?.contributionsCollection?.contributionCalendar?.weeks
    let contributionsToMirror = [];
    if (contributionsPerWeek) {
        contributionsPerWeek.map(cW => {
            cW.contributionDays.map(cD => {
                const { contributionCount, date } = cD;
                const dateMs = Date.parse(date);

                if (lastCommitDateMs < dateMs) {
                    for (let i = 0; i < contributionCount; i++) {
                        contributionsToMirror.push(dateMs);
                    }
                }
            })
        });
    }

    function commit(date) {
        return new Promise(async (resolve, reject) => {
            try {
                const isoDate = new Date(date).toISOString()
                const res = await git.commit(contributionCommitMessage, {
                    '--date': isoDate,
                    '--allow-empty': true,
                })
                resolve(res)
            } catch (e) {
                reject(e)
            }
        })
    }

    for (let i = 0; i < contributionsToMirror.length; i++) {
        await commit(contributionsToMirror[i]);
    }
}

main().then()
