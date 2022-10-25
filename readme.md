# serverless-bash-plugin

A [Serverless Framework](https://www.serverless.com/) plugin that allows writing Lambdas in Bash.

What can it do? Run any CLI tools including AWS CLI (see `s3-access` in the `example` directory) that could be packaged into layer. 

## Usage

### Installation

1. Install plugin 

```bash
npm install --save-dev serverless-bash-plugin
```

or 

```bash
yarn add --dev serverless-bash-plugin
```

2. Add plugin to your serverless.yml


```yaml
plugins:
  - serverless-bash-plugin
```

### Adding your lambdas

Add a function to the `functions` section of your serverless.yml file

```yaml
functions:
  echo:
    handler: src/echo.sh
    runtime: provided.al2
```

The plugin will detect lambda handlers ending in `.sh` extension.

Example echo handler: 

```bash
handler () {
  response=$1
}
```

The generated Bash script will call handler function and pass the request body as a first parameter, also available as variable `request`.
Set the response string to the `response` variable.

Check a full service in the `example` directory.
