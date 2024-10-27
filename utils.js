import fetch from "node-fetch";

const contributionCommitMessage = "history: has contributed to a private repo.";

const getContributions = async (token, username) => {
  const headers = {
    Authorization: `bearer ${token}`,
  };
  const body = {
    query: `query {
            user(login: "${username}") {
              contributionsCollection {
                contributionCalendar {
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                    }
                  }
                }
              }
            }
          }`,
  };
  const response = await fetch('https://api.github.com/graphql', {
    method: "POST",
    body: JSON.stringify(body),
    headers: headers,
  });
  const data = await response.json();
  return data;
};

const isSameDay = async (day1, day2) => {
  const firstDate = new Date(day1);
  const secondDate = new Date(day2);
  return (
    firstDate.getDate() === secondDate.getDate() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  );
};

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};

const filterCommitsOnMsDate = async (msDateToRefer, c) => {
  return new Promise(async (resolve) => {
    const isContributionCommit = c.message === contributionCommitMessage;
    const commitDateMs = Date.parse(c.date);
    const isSameDayCommit = await isSameDay(msDateToRefer, commitDateMs);
    resolve(isContributionCommit && isSameDayCommit);
  });
};

const getLastContributedDay = async (contributionsPerWeek) => {
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
};

export {
  contributionCommitMessage,
  getContributions,
  isSameDay,
  asyncFilter,
  getLastContributedDay,
  filterCommitsOnMsDate,
};
