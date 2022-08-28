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

async function isSameDay(day1, day2) {
    const firstDate = new Date(day1);
    const secondDate = new Date(day2)
    return firstDate.getDate() === secondDate.getDate() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getFullYear() === secondDate.getFullYear()
}

async function asyncFilter(arr, predicate) {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
}

async function filterCommitsOnMsDate(msDateToRefer, c) {
    return new Promise(async (resolve) => {
        const isContributionCommit = c.message === contributionCommitMessage;
        const commitDateMs = Date.parse(c.date);
        const isSameDayCommit = await isSameDay(msDateToRefer, commitDateMs);
        resolve(isContributionCommit && isSameDayCommit);
    })
}

async function getLastContributedDay(contributionsPerWeek) {
    let lastContributedDay;
    for (let i = contributionsPerWeek.length - 1; i >= 0; i--) {
        const { contributionDays } = contributionsPerWeek[i];
        for (let j = contributionDays.length - 1; j >= 0; j--) {
            if (contributionDays[j].contributionCount > 0) {
                lastContributedDay = contributionDays[j];
                break;
            }
        }

        if (lastContributedDay) {
            break;
        }
    }

    return lastContributedDay;
}

async function main() {
    const git = simpleGit();
    const gitLog = await git.log();
    const allCommits = gitLog?.all;
    const lastCommitDate = allCommits.find(c => c.message === contributionCommitMessage)?.date;
    const lastCommitDateMs = lastCommitDate ? Date.parse(lastCommitDate) : 0;

    const res = await getContributions(process.env.TOKEN, process.env.USERNAME)
    const contributionsPerWeek = res?.data?.user?.contributionsCollection?.contributionCalendar?.weeks
    let contributionsToMirror = [];
    if (contributionsPerWeek) {
        const lastContributedDay = await getLastContributedDay(contributionsPerWeek);

        // If there is no lastContributedDay, there is no commit to push.
        if (lastContributedDay) {
            if (lastCommitDateMs) {
                // If the script has already been run for the last contributed day, while further contributions have been
                // added, we must compare contributions count with pushed commits count for this day, since date
                // comparison won't be enough (contribution dates do not hold hour / minute information, so it's like
                // each contribution happens at midnight, hence, lastCommitMs will always be > lastContributionMs).
                const lastContributedDayMs = Date.parse(lastContributedDay.date);
                const shouldCheckLastContributedDayAgain = await isSameDay(lastContributedDayMs, lastCommitDateMs);

                if (shouldCheckLastContributedDayAgain) {
                    const lastContributedDayContributionsCount = lastContributedDay.contributionCount;
                    const sameDayCommits = await asyncFilter(allCommits, c => filterCommitsOnMsDate(lastContributedDayMs, c))
                    const sameDayCommitsCount = sameDayCommits.length;
                    const diff = lastContributedDayContributionsCount - sameDayCommitsCount;

                    if (diff > 0) {
                        for (let i = 0; i < diff; i++) {
                            contributionsToMirror.push(lastContributedDayMs);
                        }
                    }
                }
            }

            contributionsPerWeek.map(cW => {
                cW.contributionDays.map(cD => {
                    const { contributionCount, date } = cD;
                    if (contributionCount > 0) {
                        const dateMs = Date.parse(date);

                        if (lastCommitDateMs < dateMs) {
                            for (let i = 0; i < contributionCount; i++) {
                                contributionsToMirror.push(dateMs);
                            }
                        }
                    }
                })
            });
        }
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
