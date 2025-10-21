module "clerk_add_user_authorizer_lambda" {
  source  = "../modules/lambda"
  context = var.context

  name            = "clerk-add-user-authorizer-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/webhook_api_gw/authorization/clerk_authorization"
  build_path      = "${path.root}/../lambda_functions/build/webhook_api_gw/authorization/clerk_authorization/clerk_authorization.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  layers = [
    var.shared_layer_arn
  ]

  environment_variables = {
    CLERK_WEBHOOK_SECRET : var.clerk_add_user_webhook_secret
  }
}

module "clerk_add_user_lambda_authorizer" {
  source  = "../modules/api_gw/authorizers/lambda_authorizer"
  context = var.context

  rest_api_id                      = module.webhook_api_gw.api_id
  authorizer_name                  = "clerk-add-user-lambda-authorizer"
  authorizer_invoke_arn            = module.clerk_add_user_authorizer_lambda.invoke_arn
  authorizer_arn                   = module.clerk_add_user_authorizer_lambda.arn
  authorizer_result_ttl_in_seconds = 300
}

module "clerk_delete_user_authorizer_lambda" {
  source  = "../modules/lambda"
  context = var.context

  name            = "clerk-delete-user-authorizer-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/webhook_api_gw/authorization/clerk_authorization"
  build_path      = "${path.root}/../lambda_functions/build/webhook_api_gw/authorization/clerk_authorization/clerk_authorization.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  layers = [
    var.shared_layer_arn
  ]

  environment_variables = {
    CLERK_WEBHOOK_SECRET : var.clerk_delete_user_webhook_secret
  }
}

module "clerk_delete_user_lambda_authorizer" {
  source  = "../modules/api_gw/authorizers/lambda_authorizer"
  context = var.context

  rest_api_id                      = module.webhook_api_gw.api_id
  authorizer_name                  = "clerk-delete-user-lambda-authorizer"
  authorizer_invoke_arn            = module.clerk_delete_user_authorizer_lambda.invoke_arn
  authorizer_arn                   = module.clerk_delete_user_authorizer_lambda.arn
  authorizer_result_ttl_in_seconds = 300
}