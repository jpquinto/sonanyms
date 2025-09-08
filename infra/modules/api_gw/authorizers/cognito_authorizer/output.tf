output "authorizer_id" {
  value       = aws_api_gateway_authorizer.cognito.id
  description = "ID of the Cognito authorizer"
}
