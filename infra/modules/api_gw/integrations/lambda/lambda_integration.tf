resource "aws_api_gateway_method" "method" {
  rest_api_id   = var.rest_api_id
  resource_id   = var.resource_id
  http_method   = var.http_method
  authorization = var.authorizer_type
  authorizer_id = var.authorizer_id

  request_parameters = merge(
    var.request_parameters,
    var.enable_cors_all ? {
      "method.request.header.Authorization"    = var.authorizer_id != null ? true : false
      "method.request.header.Content-Type"     = false
      "method.request.header.X-User-ID"        = false
      "method.request.header.X-Requested-With" = false
    } : {}
  )

  depends_on = [
    var.authorizer_id
  ]

  api_key_required = var.enable_api_key
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = var.rest_api_id
  resource_id             = var.resource_id
  http_method             = var.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn

  request_parameters = var.enable_cors_all ? {
    "integration.request.header.Access-Control-Allow-Origin" = var.cors_allow_origin
  } : {}

  depends_on = [
    aws_api_gateway_method.method
  ]

  cache_key_parameters = var.cache_key_parameters
}

resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = var.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = var.enable_cors_all ? {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  } : {}

  depends_on = [
    aws_api_gateway_method.method,
    aws_api_gateway_integration.lambda_integration
  ]
}

resource "aws_api_gateway_integration_response" "integration_response" {
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = var.http_method
  status_code = aws_api_gateway_method_response.response_200.status_code

  response_parameters = var.enable_cors_all ? {
    "method.response.header.Access-Control-Allow-Origin" = var.cors_allow_origin
  } : {}

  depends_on = [
    aws_api_gateway_method.method,
    aws_api_gateway_method_response.response_200,
    aws_api_gateway_integration.lambda_integration
  ]
}

# Add permission for API Gateway to invoke the integration Lambda
resource "aws_lambda_permission" "api_gateway_integration" {
  statement_id  = "AllowAPIGatewayInvokeIntegration-${var.rest_api_id}-${var.resource_id}"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*"

  depends_on = [
    aws_api_gateway_method.method
  ]
}

# CORS

resource "aws_api_gateway_method" "options_method" {
  count            = var.enable_cors_all ? 1 : 0
  rest_api_id      = var.rest_api_id
  resource_id      = var.resource_id
  http_method      = "OPTIONS"
  authorization    = "NONE"
  api_key_required = false

  request_parameters = {
    "method.request.header.Authorization" = false
    "method.request.header.Content-Type"  = false
    "method.request.header.X-User-ID"     = false
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  count       = var.enable_cors_all ? 1 : 0
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options_method[0].http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  depends_on = [aws_api_gateway_method.options_method]
}

resource "aws_api_gateway_integration" "options_integration" {
  count       = var.enable_cors_all ? 1 : 0
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options_method[0].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode(
      {
        statusCode = 200
      }
    )
  }

  depends_on = [aws_api_gateway_method.options_method]
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  count       = var.enable_cors_all ? 1 : 0
  rest_api_id = var.rest_api_id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options_method[0].http_method
  status_code = aws_api_gateway_method_response.options_200[0].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = var.cors_allow_headers
    "method.response.header.Access-Control-Allow-Methods" = var.cors_allow_methods
    "method.response.header.Access-Control-Allow-Origin"  = var.cors_allow_origin
  }

  depends_on = [
    aws_api_gateway_method_response.options_200,
    aws_api_gateway_integration.options_integration,
  ]
}
