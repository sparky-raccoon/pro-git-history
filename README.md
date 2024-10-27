# About this project

pro-git-history is meant to mirror your activity as a professional developer throughout the year in a way that does not disclose any information about the company or the project you are working on, in case the company has decided not to enable the github enterprise related option, or is working with different git private instances than github (e.g gitlab). 

The main idea is to forward the Github GraphQL api fetched contributions if your company's project is github hosted or count local authored commits from the current branch otherwise.

## Installation

To use this tool, clone it to your local machine and install the necessary dependencies:

```
npm install
```

Get rid of the history of the cloned repository (most of the commits are to replicate my own contributions) and re-init git to start fresh :

```
rm -rf .git
git init
git add .
git commit -m "chore: init pro-git-history repo"
```

A `.env` file must be set up in the root directory of the project with the following information:
- `USERNAME`, and `TOKEN` are required when using the `remote-fill` command. These are respectively the URL, the username and the API token needed to make a call to the Github contributions API. Make sure your token has the right permissions - [user should be enough](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api?apiVersion=2022-11-28)
- `PROJECT_PATH` is required when using the `local-fill` command. This is an absolute path to your company's locally installed project. Mind the branch you are counting commits from.

## Usage

`local-fill` will replicate local commits from the current branch of the targeted project, while `remote-fill` will fetch contributions from the company's Github instance and transform them into 1:1 commits.

Once the command has completed, you'll get either way **empty** commits with the folliwng message **"history: has contributed to a private repo."**. Their dates match the contributions / commits they replicate ☼. You can push them to your Github repository.

☼ Since github contributions do not hold hour / minute information, the replicated commits will be set to 12:00 AM UTC.

**Note that the replicated commits will be obfuscated and will not contain any information about the company or its projects**.

It's ok to push other commits in-between "history: ..." commits, as long as the commit messages are different. Like, you can use anything but what's being used to distinguish history/contributions commits.

**Note that the API may not return the exact same number of contributions. In my xp, reviews might not be included**.

## Contributing

Contributions to this project are welcomed ! Please note that this tool is first designed for my personal usage and may not cover all cases. 

If you have any ideas for how to improve it or if you find any bugs, please feel free to submit a pull request or open an issue. Any contributions to make this tool more robust and adaptable to various use cases are welcomed.

## Background

I created this project since I wasn't very happy about not being able to remember how much I got involved in companies, which made my public github history empty and did not reflect my overall activity as a developer.
