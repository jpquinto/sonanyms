module "label_layer" {
  source = "cloudposse/label/null"

  name = var.name

  context = var.context
}

resource "aws_lambda_layer_version" "version" {
  layer_name  = module.label_layer.id
  description = var.description

  compatible_architectures = var.architecture
  compatible_runtimes      = var.runtime

  # zip
  filename         = local.is_zip ? var.zip_project ? data.archive_file.zip[0].output_path : var.filename : null
  source_code_hash = local.is_zip ? var.zip_project ? data.archive_file.zip[0].output_base64sha256 : filebase64sha256(var.filename) : null

  # s3
  s3_bucket         = local.is_s3 ? var.s3_bucket : null
  s3_key            = local.is_s3 ? local.s3_key : null
  s3_object_version = local.is_s3 ? var.upload_to_s3 ? aws_s3_object.s3_upload[0].version_id : var.s3_object_version : null
}
