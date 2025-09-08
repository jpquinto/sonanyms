module "label_lambda" {
  source = "cloudposse/label/null"

  name = var.name

  context = var.context
}

resource "aws_lambda_function" "function" {
  function_name = module.label_lambda.id
  description   = var.description
  role          = aws_iam_role.execution_role.arn

  runtime       = !local.is_image ? var.runtime : null
  handler       = !local.is_image ? var.handler : null
  memory_size   = var.memory
  timeout       = var.time_limit
  architectures = [var.platform]
  layers        = var.layers
  publish       = var.publish

  # zip
  filename         = local.is_zip ? var.zip_project ? data.archive_file.zip[0].output_path : var.filename : null
  source_code_hash = local.is_zip ? var.zip_project ? data.archive_file.zip[0].output_base64sha256 : filebase64sha256(var.filename) : null
  package_type     = local.is_zip ? "Zip" : local.is_image ? "Image" : null

  # s3
  s3_bucket         = local.is_s3 ? var.s3_bucket : null
  s3_key            = local.is_s3 ? local.s3_key : null
  s3_object_version = local.is_s3 ? var.upload_to_s3 ? aws_s3_object.s3_upload[0].version_id : var.s3_object_version : null

  environment {
    variables = merge({ ENV = module.label_lambda.environment }, var.environment_variables)
  }
}
