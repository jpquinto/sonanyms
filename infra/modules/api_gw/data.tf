data "aws_region" "current" {}

data "aws_iam_policy_document" "api_policy" {
  count = contains(var.api_type, "PRIVATE") ? 1 : 0

  statement {
    effect = "Allow"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["execute-api:Invoke"]
    # resources = [
    #   "*"
    # ]
    resources = ["${aws_api_gateway_rest_api.api.execution_arn}/*"]


    condition {
      test     = "StringEquals"
      variable = "aws:SourceVpce"
      values   = var.vpc_endpoint_ids
    }
  }
}
