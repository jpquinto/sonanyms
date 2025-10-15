# modules/websocket_api_gateway/labels.tf
module "main_ctx" {
  source  = "cloudposse/label/null"
  context = var.context

  tags = {
    "component" = "apigw_websocket"
  }
}

module "label_apigw" {
  source  = "cloudposse/label/null"
  context = module.main_ctx.context

  attributes = ["ws-apigw"]
}

module "label_apigw_api" {
  source = "cloudposse/label/null"

  context    = module.label_apigw.context
  attributes = ["api"]
}

module "label_apigw_stage" {
  source = "cloudposse/label/null"

  context    = module.label_apigw.context
  attributes = ["stage"]
}