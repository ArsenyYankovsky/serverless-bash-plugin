#!/usr/bin/env bash

## HANDLER

get_next_request() {
    nextInvocationResponse=$(curl -si -w "\n%{size_header},%{size_download}" "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/next")

    # Extract the response header size.
    headerSize=$(sed -n '$ s/^\([0-9]*\),.*$/\1/ p' <<< "${nextInvocationResponse}")

    # Extract the response body size.
    bodySize=$(sed -n '$ s/^.*,\([0-9]*\)$/\1/ p' <<< "${nextInvocationResponse}")

    # Extract the response headers.
    headers="${nextInvocationResponse:0:${headerSize}}"

    requestId=$(grep "Lambda-Runtime-Aws-Request-Id: .*$" <<< "$headers")
    requestId=${requestId#"Lambda-Runtime-Aws-Request-Id: "}
    requestId=$(echo "$requestId"|tr -d '\r')

    # Extract the response body.
    request="${nextInvocationResponse:${headerSize}:${bodySize}}"
}

report_error() {
  curl -s -X POST "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$requestId/error"
}

while :
do
  get_next_request

  {
    {
      handler $request
    } && {
      curl -s -X POST "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$requestId/response" -d "$response"
    }
  } || {
    echo "error!"
    report_error
  }
done
