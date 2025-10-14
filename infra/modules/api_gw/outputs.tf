output "api_id" {
  description = "The ID of the REST API"
  value       = aws_api_gateway_rest_api.api.id
}

output "execution_arn" {
  description = "The execution ARN part to be used in lambda_permission's source_arn"
  value       = aws_api_gateway_rest_api.api.execution_arn
}

output "invoke_url" {
  description = "The base URL for invoking the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.stage_name}"
}

output "http_urls" {
  description = "List of full HTTP URLs for API Gateway resources"
  value = [
    for route in var.http_routes :
    "https://${aws_api_gateway_rest_api.api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.stage_name}/${route.path}"
  ]
}

output "api" {
  description = "The API Gateway REST API resource"
  value       = aws_api_gateway_rest_api.api
}
