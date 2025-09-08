# resource "aws_api_gateway_api_key" "api_key" {
#   count = var.enable_api_key ? 1 : 0

#   name        = "${var.api_name}-api-key"
#   description = "API Key for ${var.api_name}"
#   enabled     = true
# }

# resource "aws_api_gateway_usage_plan" "usage_plan" {
#   count = var.enable_api_key ? 1 : 0

#   name = "${var.api_name}-usage-plan"

#   api_stages {
#     api_id = aws_api_gateway_rest_api.api.id
#     stage  = aws_api_gateway_stage.auth_stage.stage_name
#   }

#   throttle_settings {
#     rate_limit  = var.api_key_rate_limit
#     burst_limit = var.api_key_burst_limit
#   }
# }

# resource "aws_api_gateway_usage_plan_key" "api_key_association" {
#   count = var.enable_api_key ? 1 : 0

#   key_id        = aws_api_gateway_api_key.api_key[0].id
#   key_type      = "API_KEY"
#   usage_plan_id = aws_api_gateway_usage_plan.usage_plan[0].id
# }
