# Sticky Scroll Extension - Telemetry Backend Infrastructure

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GKE Cluster for telemetry service
resource "google_container_cluster" "telemetry_cluster" {
  name     = "sticky-scroll-telemetry"
  location = var.region

  initial_node_count       = 1
  remove_default_node_pool = true

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }
}

# Node pool
resource "google_container_node_pool" "telemetry_nodes" {
  name       = "telemetry-node-pool"
  location   = var.region
  cluster    = google_container_cluster.telemetry_cluster.name
  node_count = 1

  node_config {
    machine_type = "e2-micro"
    
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      component = "telemetry"
    }
  }
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "sticky-scroll-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "sticky-scroll-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Cloud SQL (PostgreSQL) for telemetry data
resource "google_sql_database_instance" "telemetry_db" {
  name             = "sticky-scroll-db"
  database_version = "POSTGRES_14"
  region          = var.region

  settings {
    tier = "db-f1-micro"
    
    database_flags {
      name  = "log_statement"
      value = "all"
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "telemetry" {
  name     = "telemetry"
  instance = google_sql_database_instance.telemetry_db.name
}