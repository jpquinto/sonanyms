resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  name                             = var.authorizer_name
  rest_api_id                      = var.rest_api_id
  authorizer_uri                   = var.authorizer_invoke_arn
  authorizer_credentials           = aws_iam_role.invocation_role.arn
  authorizer_result_ttl_in_seconds = var.authorizer_result_ttl_in_seconds
  type                             = "TOKEN"
  identity_source                  = "method.request.header.Authorization"
}

data "aws_iam_policy_document" "invocation_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}



resource "aws_iam_role" "invocation_role" {
  name               = "${module.label_authorizer_role.id}-${var.authorizer_name}"
  tags               = module.label_authorizer_role.tags
  path               = "/"
  assume_role_policy = data.aws_iam_policy_document.invocation_assume_role.json
}

data "aws_iam_policy_document" "invocation_policy" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = [var.authorizer_arn]
  }
}

resource "aws_iam_role_policy" "invocation_policy" {
  name   = "${module.label_authorizer_policy.id}-${var.authorizer_name}"
  role   = aws_iam_role.invocation_role.id
  policy = data.aws_iam_policy_document.invocation_policy.json
}