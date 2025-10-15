module main_ctx {
  source = "cloudposse/label/null"
  context = var.context

  tags = {
    component = "apigw-rest_lambda-authorizer"
  }
}

module "label_authorizer_lambda" {
  source = "cloudposse/label/null"

  context = module.main_ctx.context

  attributes = ["lambda-authorizer"]
}

module "label_authorizer_role" {
  source = "cloudposse/label/null"
  context = module.label_authorizer_lambda.context

  attributes = ["role"]
}

module "label_authorizer_policy" {
  source = "cloudposse/label/null"
  context = module.label_authorizer_lambda.context

  attributes = ["policy"]
}