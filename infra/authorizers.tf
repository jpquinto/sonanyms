module "user_authorizer_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "user-authorizer-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/base_api_gw/authorization/user_authorization"
  build_path      = "${path.root}/../lambda_functions/build/base_api_gw/authorization/user_authorization/user_authorization.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    USER_API_KEY : local.sonanyms_secrets.USER_API_KEY
  }
}

module "admin_authorizer_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "admin-authorizer-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/base_api_gw/authorization/admin_authorization"
  build_path      = "${path.root}/../lambda_functions/build/base_api_gw/authorization/admin_authorization/admin_authorization.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    ADMIN_API_KEY : local.sonanyms_secrets.ADMIN_API_KEY
  }
}

# User Lambda Authorizer for API Gateway
module "user_lambda_authorizer" {
  source  = "./modules/api_gw/authorizers/lambda_authorizer"
  context = module.null_label.context

  rest_api_id                      = module.user_api_gw.api_id
  authorizer_name                  = "user-lambda-authorizer"
  authorizer_invoke_arn            = module.user_authorizer_lambda.invoke_arn
  authorizer_arn                   = module.user_authorizer_lambda.arn
  authorizer_result_ttl_in_seconds = 300
}

# Admin Lambda Authorizer for API Gateway
module "admin_lambda_authorizer" {
  source  = "./modules/api_gw/authorizers/lambda_authorizer"
  context = module.null_label.context

  rest_api_id                      = module.user_api_gw.api_id
  authorizer_name                  = "admin-lambda-authorizer"
  authorizer_invoke_arn            = module.admin_authorizer_lambda.invoke_arn
  authorizer_arn                   = module.admin_authorizer_lambda.arn
  authorizer_result_ttl_in_seconds = 300
}