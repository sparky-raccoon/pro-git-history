# About this project

pro-git-history is a node script designed to help developers keep track of their contributions to company projects. It is meant to be used in conjunction with a personal Github repository.

The tool aims to preserve your contributions even after you leave the company by replicating them in a way that does not disclose any information about the company or its projects.

This project offers two npm commands: `local-fill` and `remote-fill`. The first one replicates local commits from the current branch of the targeted project, while the second one fetches contributions from the company's Github instance.

## Installation

To use this tool, clone it to your local machine and run the following command to install the necessary dependencies:

```
npm install
```

Get rid of the history of the cloned repository by running the following command:

```
rm -rf .git
```

A `.env` file must be set up in the root directory of the project with the following information:

- `COMPANY`, `USERNAME`, and `TOKEN` are required when using the `remote-fill` command. These are respectively the URL, the username and the API token needded to make a call to the Github contributions API.
- `PROJECT_PATH` is required when using the `local-fill` command. This is an absolute path starting with "/". It is used to target the local company project.

## Usage

`local-fill` will replicate local commits from the current branch of the targeted project, while `remote-fill` will fetch contributions from the company's Github instance and transform them into commits.

Once the command has completed, you'll get either way **empty** commits with the folliwng message **"history: has contributed to a private repo."**. Their dates match the contributions / commits they replicate ☼. You can push them to your Github repository.

☼ Since github contributions do not hold hour / minute information, the replicated commits will be set to 12:00 AM UTC.

**Note that the replicated commits will be obfuscated and will not contain any information about the company or its projects**.

## Contributing

Contributions to this project are welcomed ! Please note that this tool is first designed for my personal usage and may not cover all cases. This project is missing unit tests and the main script could be written in a better way, has many defects.

If you have any ideas for how to improve it or if you find any bugs, please feel free to submit a pull request or open an issue. Any contributions to make this tool more robust and adaptable to various use cases are welcomed.

## Background

I created this project since I wasn't very happy about not being able to remember how much I got involved in companies, which made my public github history empty and did not reflect my overall activity as a developer.
