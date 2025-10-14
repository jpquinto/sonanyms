variable "aws_region" {
  description = "Target region"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "project_namespace" {
  description = "Namespace of the project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "stage" {
  description = "Product stage"
  type        = string
}

variable "owner" {
  description = "Owner of the product"
  type        = string
}

variable "developer" {
  description = "Developer of the product"
  type        = string
}
