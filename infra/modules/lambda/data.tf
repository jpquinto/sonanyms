data "aws_subnet" "lambda_subnet" {
  count = var.enable_vpc_access ? 1 : 0

  id = var.subnet_ids[0]
}
