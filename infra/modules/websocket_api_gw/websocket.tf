resource "aws_apigatewayv2_api" "websocket_api" {
  name                       = module.label_apigw_api.id
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
  tags                       = module.label_apigw_api.tags
}

# Routes
resource "aws_apigatewayv2_route" "routes" {
  for_each = { for route in var.routes : route.route_key => route }

  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.integrations[each.key].id}"

  authorization_type = each.value.authorization_type
  authorizer_id      = each.value.authorizer_id
}

# Integrations
resource "aws_apigatewayv2_integration" "integrations" {
  for_each = { for route in var.routes : route.route_key => route }

  api_id             = aws_apigatewayv2_api.websocket_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = each.value.lambda_invoke_arn
  integration_method = "POST"
}

# Lambda permissions
resource "aws_lambda_permission" "api_gateway_invoke" {
  for_each = { for route in var.routes : route.route_key => route }

  statement_id  = "AllowAPIGatewayInvoke-${replace(each.key, "$", "")}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket_api.execution_arn}/*/${each.key}"
}

# Deployment with hash triggers
resource "aws_apigatewayv2_deployment" "deployment" {
  api_id = aws_apigatewayv2_api.websocket_api.id

  triggers = {
    routes_hash = sha256(jsonencode({
      routes       = var.routes
      integrations = aws_apigatewayv2_integration.integrations
    }))

    api_hash = sha256(jsonencode({
      api    = aws_apigatewayv2_api.websocket_api
      routes = aws_apigatewayv2_route.routes
    }))

    redeployment_hash = sha256(join(",", [
      jsonencode(aws_apigatewayv2_api.websocket_api),
      jsonencode(aws_apigatewayv2_route.routes),
      jsonencode(aws_apigatewayv2_integration.integrations)
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_apigatewayv2_route.routes,
    aws_apigatewayv2_integration.integrations
  ]
}

# Stage
resource "aws_apigatewayv2_stage" "stage" {
  api_id        = aws_apigatewayv2_api.websocket_api.id
  name          = var.stage_name
  deployment_id = aws_apigatewayv2_deployment.deployment.id
  tags          = module.label_apigw_stage.tags

  default_route_settings {
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }
}