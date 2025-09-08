module "cognito_label" {
  source = "cloudposse/label/null"
  name   = "cognito-authorizer"

  context = var.label_context
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = module.cognito_label.id
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = var.rest_api_id
  provider_arns = [var.cognito_user_pool_arn]
}
