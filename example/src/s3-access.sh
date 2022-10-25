handler() {
  response=$(/opt/aws/dist/aws s3api list-buckets --output json)
}
