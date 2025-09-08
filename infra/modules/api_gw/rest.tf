module "aws_api_gateway_rest_api_label" {
  source = "cloudposse/label/null"
  name   = var.api_name

  context = var.label_context
}

resource "aws_api_gateway_rest_api" "api" {
  name = module.aws_api_gateway_rest_api_label.id
  tags = module.aws_api_gateway_rest_api_label.tags
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

# resource "aws_api_gateway_deployment" "deployment" {
#   rest_api_id = aws_api_gateway_rest_api.api.id

#   depends_on = [
#     aws_api_gateway_rest_api_policy.policy,
#   ]
# }

# resource "aws_api_gateway_stage" "auth_stage" {
#   deployment_id = aws_api_gateway_deployment.deployment.id
#   rest_api_id   = aws_api_gateway_rest_api.api.id
#   stage_name    = var.stage_name
#   tags          = module.aws_api_gateway_rest_api_label.tags

#   variables = {
#     "cors" = "true"
#   }
# }
