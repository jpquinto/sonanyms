module "label_lambda_exec_role" {
  source = "cloudposse/label/null"

  name = "${var.name}-exec-role"

  context = var.context
}

resource "aws_iam_role" "execution_role" {
  name        = module.label_lambda_exec_role.id
  description = "Execution role for Lambda function ${module.label_lambda.id}"

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

  tags = module.label_lambda_exec_role.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution_role" {
  role       = aws_iam_role.execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_eni_management_access" {
  count = var.enable_vpc_access ? 1 : 0

  role       = aws_iam_role.execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaENIManagementAccess"
}
