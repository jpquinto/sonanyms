
resource "aws_api_gateway_rest_api" "api" {
  name = module.label_apigw.id
  tags = module.label_apigw.tags
  endpoint_configuration {
    types = var.api_type
  }
}

resource "aws_api_gateway_rest_api_policy" "policy" {
  count       = contains(var.api_type, "PRIVATE") ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.api.id
  policy      = data.aws_iam_policy_document.api_policy[count.index].json
}

resource "aws_api_gateway_resource" "resources" {
  for_each    = { for r in var.http_routes : r.path => r }
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = each.value.path
}

module "api_lambda_integration" {
  source = "./integrations/lambda"

  for_each = {
    for route in var.http_routes : route.path => route
    if route.integration_type == "lambda"
  }

  rest_api_id          = aws_api_gateway_rest_api.api.id
  resource_id          = aws_api_gateway_resource.resources[each.key].id
  http_method          = each.value.http_method
  lambda_invoke_arn    = each.value.lambda_invoke_arn
  lambda_function_name = each.value.lambda_function_name

  authorizer_type   = "NONE"
  api_execution_arn = aws_api_gateway_rest_api.api.execution_arn
  enable_cors_all   = each.value.enable_cors_all
  enable_api_key    = var.enable_api_key
}

# Update the deployment triggers to include Cognito authorizer
resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    routes_hash = jsonencode(var.http_routes)

    integrations_hash = jsonencode({
      lambda = module.api_lambda_integration
    })

    api_hash = sha256(jsonencode({
      rest_api = aws_api_gateway_rest_api.api.body
      resources = {
        for k, v in aws_api_gateway_resource.resources : k => {
          path_part = v.path_part
          parent_id = v.parent_id
        }
      }
    }))

    policy_hash = contains(var.api_type, "PRIVATE") ? sha256(jsonencode({
      policy = aws_api_gateway_rest_api_policy.policy[0].policy
    })) : "no-policy"

    redeployment_hash = sha256(join(",", [
      jsonencode(aws_api_gateway_rest_api.api),
      jsonencode(aws_api_gateway_resource.resources),
      jsonencode(module.api_lambda_integration)
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    module.api_lambda_integration,
    aws_api_gateway_rest_api_policy.policy,
  ]
}

resource "aws_api_gateway_stage" "auth_stage" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.stage_name
  tags          = module.label_apigw_rest_api_label.tags

  variables = {
    "cors" = "true"
  }
}
