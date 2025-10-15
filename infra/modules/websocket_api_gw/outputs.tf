# modules/websocket_api_gateway/outputs.tf
output "api_id" {
  description = "The ID of the WebSocket API"
  value       = aws_apigatewayv2_api.websocket_api.id
}

output "api_endpoint" {
  description = "The URI of the WebSocket API"
  value       = aws_apigatewayv2_api.websocket_api.api_endpoint
}

output "execution_arn" {
  description = "The execution ARN to be used in IAM policies"
  value       = aws_apigatewayv2_api.websocket_api.execution_arn
}

output "invoke_url" {
  description = "The URL to invoke the WebSocket API"
  value       = aws_apigatewayv2_stage.stage.invoke_url
}

output "stage_name" {
  description = "The name of the stage"
  value       = aws_apigatewayv2_stage.stage.name
}

output "api" {
  description = "The WebSocket API resource"
  value       = aws_apigatewayv2_api.websocket_api
}

output "stage" {
  description = "The WebSocket API stage resource"
  value       = aws_apigatewayv2_stage.stage
}