locals {
  is_zip = var.deployment_type == "zip"
  is_s3  = var.deployment_type == "s3"
}

locals {
  s3_key = coalesce(var.s3_key, "${module.label_layer.id}.zip")
}
