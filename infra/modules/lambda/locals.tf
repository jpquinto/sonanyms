locals {
  is_zip   = var.deployment_type == "zip"
  is_s3    = var.deployment_type == "s3"
  is_image = var.deployment_type == "image"
}

locals {
  s3_key = coalesce(var.s3_key, "${module.label_lambda.id}.zip")
}
