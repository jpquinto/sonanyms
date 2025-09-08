output "api_id" {
  value = aws_api_gateway_rest_api.api.id
}

output "execution_arn" {
  value = aws_api_gateway_rest_api.api.execution_arn
}

output "http_urls" {
  description = "List of full HTTP URLs for API Gateway resources"
  value = [
    for route in var.http_routes :
    "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}/${route.path}"
  ]
}

output "api" {
  value = aws_api_gateway_rest_api.api
}
