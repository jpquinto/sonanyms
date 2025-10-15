output "authorizer_id" {
  value = aws_api_gateway_authorizer.lambda_authorizer.id
}

output "invocation_role_arn" {
  value = aws_iam_role.invocation_role.arn
}