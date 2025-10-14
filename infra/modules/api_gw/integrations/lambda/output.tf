output "deployment_dependencies" {
  value = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_method_response.response_200,
    aws_api_gateway_integration_response.integration_response
  ]
}