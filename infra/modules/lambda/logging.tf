resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${module.label_lambda.id}"
  retention_in_days = var.log_retention_days

  tags = module.label_lambda.tags
}
