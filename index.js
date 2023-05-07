import { config } from "dotenv";
import simpleGit from "simple-git";
import {
  contributionCommitMessage,
  getContributions,
  isSameDay,
  asyncFilter,
  filterCommitsOnMsDate,
  getLastContributedDay,
} from "./utils.js";

config();

// Commits in this repo are replications of company remote contributions or local commits on main branch.
const MODE = process.argv[2] || "remote-contributions"; // "remote-contributions" or "local-main-commits"

const main = async () => {
  const git = simpleGit();
  const gitLog = await git.log();
  const allCommits = gitLog?.all;
  const lastCommitDate = allCommits.find(
    (c) => c.message === contributionCommitMessage
  )?.date;
  const lastCommitDateMs = lastCommitDate ? Date.parse(lastCommitDate) : 0;

  let contributionsToMirror = [];

  if (MODE === "local-main-commits") {
    const otherGit = simpleGit(process.env.PROJECT_PATH);
    const otherGitLog = await otherGit.log();
    const allOtherCommits = otherGitLog?.all;

    let otherCommitIndex = 0;
    while (
      Date.parse(allOtherCommits[otherCommitIndex].date) > lastCommitDateMs &&
      otherCommitIndex < allOtherCommits.length - 1
    ) {
      contributionsToMirror.push(allOtherCommits[otherCommitIndex].date);
      otherCommitIndex++;
    }
  } else {
    if (!process.env.COMPANY || !process.env.TOKEN || !process.env.USERNAME)
      return;
    const res = await getContributions(
      process.env.COMPANY,
      process.env.TOKEN,
      process.env.USERNAME
    );
    const contributionsPerWeek =
      res?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (contributionsPerWeek) {
      const lastContributedDay = await getLastContributedDay(
        contributionsPerWeek
      );

      // If there is no lastContributedDay, there is no commit to push.
      if (lastContributedDay) {
        if (lastCommitDateMs) {
          // If the script has already been run for the last contributed day, while further contributions have been
          // added, we must compare contributions count with pushed commits count for this day, since date
          // comparison won't be enough (contribution dates do not hold hour / minute information, so it's like
          // each contribution happens at midnight, hence, lastCommitMs will always be > lastContributionMs).
          const lastContributedDayMs = Date.parse(lastContributedDay.date);
          const shouldCheckLastContributedDayAgain = await isSameDay(
            lastContributedDayMs,
            lastCommitDateMs
          );

          if (shouldCheckLastContributedDayAgain) {
            const lastContributedDayContributionsCount =
              lastContributedDay.contributionCount;
            const sameDayCommits = await asyncFilter(allCommits, (c) =>
              filterCommitsOnMsDate(lastContributedDayMs, c)
            );
            const sameDayCommitsCount = sameDayCommits.length;
            const diff =
              lastContributedDayContributionsCount - sameDayCommitsCount;

            if (diff > 0) {
              for (let i = 0; i < diff; i++) {
                contributionsToMirror.push(lastContributedDayMs);
              }
            }
          }
        }

        contributionsPerWeek.map((cW) => {
          cW.contributionDays.map((cD) => {
            const { contributionCount, date } = cD;
            if (contributionCount > 0) {
              const dateMs = Date.parse(date);

              if (lastCommitDateMs < dateMs) {
                for (let i = 0; i < contributionCount; i++) {
                  contributionsToMirror.push(dateMs);
                }
              }
            }
          });
        });
      }
    }
  }

  const commit = (date) => {
    return new Promise(async (resolve, reject) => {
      try {
        const isoDate = new Date(date).toISOString();
        const res = await git.commit(contributionCommitMessage, {
          "--date": isoDate,
          "--allow-empty": true,
        });
        resolve(res);
      } catch (e) {
        reject(e);
      }
    });
  };

  for (let i = 0; i < contributionsToMirror.length; i++) {
    await commit(contributionsToMirror[i]);
  }
};

main().then();
