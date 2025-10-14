########### zip ###########
data "archive_file" "zip" {
  count = var.zip_project ? 1 : 0

  type        = "zip"
  source_dir  = var.source_dir
  output_path = var.build_path

  excludes = ["*.zip"]
}


########### s3 ###########
resource "aws_s3_object" "s3_upload" {
  count = var.upload_to_s3 ? 1 : 0

  bucket      = var.s3_bucket
  key         = local.s3_key
  source      = data.archive_file.zip[0].output_path
  source_hash = data.archive_file.zip[0].output_sha256

  depends_on = [data.archive_file.zip[0]]

  tags = module.label_layer.tags
}
