module "main_ctx" {
  source  = "cloudposse/label/null"
  context = var.context

  tags = {
    "component" = "apigw_rest"
  }
}

module "label_apigw" {
  source  = "cloudposse/label/null"
  context = module.main_ctx.context

  attributes = ["apigw"]
}

module "label_apigw_usageplan" {
  source = "cloudposse/label/null"

  context    = module.label_apigw.context
  attributes = ["usage-plan"]
}
module "label_apigw_apikey" {
  source = "cloudposse/label/null"

  context    = module.label_apigw.context
  attributes = ["api-key"]
}

module "label_apigw_rest_api_label" {
  source = "cloudposse/label/null"

  context    = module.label_apigw.context
  attributes = ["rest-api"]
}