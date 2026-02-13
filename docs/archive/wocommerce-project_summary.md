# 🚀 Multi-Client WooCommerce Data Pipeline

## 📋 Project Overview

This Python project automatically syncs WooCommerce order data from multiple client stores into a centralized PostgreSQL database. It supports both incremental daily syncs and full historical backfills.

## ✨ Key Features

### 🏢 Multi-Client Support
- Manage multiple WooCommerce stores from one pipeline
- Individual client configurations with YAML files
- Separate database tables per client with prefixes
- Per-client timezone and sync settings

### 📊 Data Management  
- **Incremental Sync**: Daily updates for last 7 days
- **Historical Backfill**: Import all historical data
- **Data Validation**: Automatic cleaning and error handling
- **PostgreSQL Storage**: Robust relational database with indexes

### 🔧 Production Ready
- **Error Handling**: Comprehensive logging and error recovery
- **Rate Limiting**: Respects WooCommerce API limits
- **Monitoring**: Sync logs and status tracking
- **CLI Interface**: Easy command-line operations

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client 1      │    │                  │    │                 │
│   WooCommerce   │───▶│   Python API     │───▶│   PostgreSQL    │
│   REST API      │    │   Client         │    │   Database      │
└─────────────────┘    │                  │    │                 │
                       │                  │    │   - clients     │
┌─────────────────┐    │  - Rate Limiting │    │   - orders      │
│   Client 2      │    │  - Error Handling│    │   - order_items │
│   WooCommerce   │───▶│  - Data Processing│───▶│   - customers   │
│   REST API      │    │  - Batch Loading │    │   - sync_logs   │
└─────────────────┘    │                  │    │                 │
                       └──────────────────┘    └─────────────────┘
┌─────────────────┐             │
│   Client 3      │             │
│   WooCommerce   │─────────────┘
│   REST API      │
└─────────────────┘
```

## 📁 Project Structure

```
woocommerce_pipeline/
├── clients/                 # 👥 Client configurations
│   ├── client_1/
│   │   ├── config.yaml     # API keys & settings
│   │   └── README.md       # Setup instructions
│   ├── client_2/
│   ├── client_3/
│   └── client_4/
├── src/                     # 🐍 Python source code
│   ├── woocommerce_api.py  # API client with rate limiting
│   ├── database.py         # PostgreSQL operations
│   ├── models.py           # Database schemas
│   ├── data_processor.py   # Data transformation
│   ├── client_manager.py   # Configuration management
│   └── utils.py
├── scripts/                 # 🔧 Execution scripts
│   ├── run_sync.py         # Main CLI interface
│   ├── daily_sync.py       # Automated daily sync
│   └── backfill.py         # Historical data import
├── migrations/              # 📊 Database setup
├── logs/                    # 📝 Application logs
├── config/                  # ⚙️ Global settings
├── requirements.txt         # 📦 Dependencies
├── docker-compose.yml       # 🐳 PostgreSQL setup
└── .env                     # 🔐 Environment variables
```

## 🚀 Quick Start Guide

### 1️⃣ Setup Environment
```bash
# Create project directory
mkdir woocommerce_pipeline && cd woocommerce_pipeline

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### 2️⃣ Database Setup
```bash
# Option A: Docker (Recommended)
docker-compose up -d

# Option B: Local PostgreSQL
createdb woocommerce_data

# Create database tables
python scripts/run_sync.py --migrate
```

### 3️⃣ Configure Clients
```bash
# Create client configurations
python scripts/run_sync.py --create-client client_1
python scripts/run_sync.py --create-client client_2
python scripts/run_sync.py --create-client client_3
python scripts/run_sync.py --create-client client_4

# Edit each config with real API credentials
nano clients/client_1/config.yaml
```

**Sample Configuration:**
```yaml
client:
  name: "Your Store Name"
  slug: "client_1"

woocommerce:
  base_url: "https://yourstore.com"
  consumer_key: "ck_your_actual_key"     # From WooCommerce REST API
  consumer_secret: "cs_your_actual_secret"

sync:
  enabled: true
  timezone: "Europe/Copenhagen"
  default_lookback_days: 7
```

### 4️⃣ Test Connections
```bash
# Test specific client
python scripts/run_sync.py --test-connection --client client_1

# Test all clients
python scripts/run_sync.py --test-connection --all-clients
```

### 5️⃣ Initial Data Import
```bash
# Backfill all historical data for one client
python scripts/backfill.py --client client_1

# Or backfill from specific date
python scripts/backfill.py --client client_1 --start-date 2024-01-01
```

### 6️⃣ Daily Operations
```bash
# Manual sync (last 7 days)
python scripts/daily_sync.py

# Sync specific client
python scripts/run_sync.py --sync --client client_1

# Sync all clients
python scripts/run_sync.py --sync --all-clients

# Check status
python scripts/run_sync.py --status
```

## 📊 Database Schema

### Core Tables
- **`clients`** - Client configurations and metadata
- **`orders`** - Complete order information from all clients
- **`order_items`** - Individual line items for each order
- **`customers`** - Customer information across all clients
- **`sync_logs`** - ETL process monitoring and error tracking

### Key Features
- **Multi-tenant**: Client-specific data isolation
- **Audit Trail**: Complete sync history and error tracking
- **Performance**: Optimized indexes for fast queries
- **JSON Storage**: Flexible metadata and raw data storage

## 🔄 Sync Strategies

### Daily Sync (Incremental)
- Runs automatically via cron job
- Fetches last 7 days to catch updates
- Updates existing orders, creates new ones
- ~2-5 minutes per client (depending on volume)

### Historical Backfill
- One-time import of all historical data
- Can be run from specific start date
- Processes in batches to handle large datasets
- Can take hours for stores with thousands of orders

### Error Handling
- Individual client failures don't affect others
- Automatic retry logic with exponential backoff
- Comprehensive logging for troubleshooting
- Failed orders logged but don't stop processing

## 🖥️ Command Reference

```bash
# Setup & Migration
python scripts/run_sync.py --migrate                    # Create database tables
python scripts/run_sync.py --create-client CLIENT_NAME  # Create sample config

# Connection Testing  
python scripts/run_sync.py --test-connection --client CLIENT_NAME
python scripts/run_sync.py --test-connection --all-clients

# Data Synchronization
python scripts/run_sync.py --sync --client CLIENT_NAME              # Sync one client
python scripts/run_sync.py --sync --all-clients                     # Sync all clients
python scripts/run_sync.py --sync --client CLIENT_NAME --days 30    # Custom date range

# Historical Backfill
python scripts/backfill.py --client CLIENT_NAME                     # All historical data
python scripts/backfill.py --client CLIENT_NAME --start-date 2024-01-01

# Monitoring & Status
python scripts/run_sync.py --status                     # All clients overview
python scripts/run_sync.py --status --client CLIENT_NAME # Specific client details

# Automated Daily Sync
python scripts/daily_sync.py                            # Run daily sync for all clients
```

## 📈 Monitoring & Maintenance

### Log Files
- **Application Logs**: `logs/app.log`
- **Sync History**: Stored in `sync_logs` database table
- **Error Tracking**: Failed operations logged with details

### Database Maintenance
```bash
# View database statistics
python scripts/run_sync.py --status

# Clean up old logs (30+ days)
python -c "from src.database import db_manager; db_manager.cleanup_old_logs()"

# Check database health
python -c "from src.database import db_manager; print(db_manager.health_check())"
```

### Automation Setup
```bash
# Add to crontab for daily automation
crontab -e

# Daily sync at 2 AM
0 2 * * * /path/to/venv/bin/python /path/to/project/scripts/daily_sync.py

# Weekly cleanup at 3 AM on Sunday  
0 3 * * 0 /path/to/venv/bin/python -c "from src.database import db_manager; db_manager.cleanup_old_logs()"
```

## 🔐 Security Considerations

- Store API credentials in environment variables or encrypted config
- Use PostgreSQL user with minimum required permissions
- Enable SSL for database connections in production
- Regular backup of database and configuration files
- Monitor API rate limits to avoid being blocked

## 🚀 Production Deployment

### Environment Setup
1. **Server Requirements**: Python 3.8+, PostgreSQL 12+
2. **Dependencies**: Install from requirements.txt
3. **Database**: Create dedicated database and user
4. **Cron Jobs**: Setup automated daily sync
5. **Monitoring**: Configure log rotation and alerting

### Scaling Considerations
- Each client can process ~1000 orders in 2-3 minutes
- Database can handle millions of orders with proper indexing
- Consider partitioning for very large datasets
- Monitor API rate limits (usually 500-1000 requests/hour)

## 🎯 Next Steps

1. **Complete Setup**: Follow the quick start guide above
2. **Configure Clients**: Add your actual WooCommerce API credentials
3. **Initial Backfill**: Import historical data for each client
4. **Automate Daily Sync**: Setup cron jobs for regular updates
5. **Monitor & Maintain**: Check logs and database regularly

## 🆘 Troubleshooting

### Common Issues
- **API Connection Failed**: Check credentials and URL format
- **Database Connection Error**: Verify PostgreSQL is running and credentials correct
- **Sync Failures**: Check logs/app.log for detailed error messages
- **Performance Issues**: Review batch sizes and rate limiting settings

### Support Resources
- Check `logs/app.log` for detailed error messages
- Use `--log-level DEBUG` for verbose troubleshooting
- Review client-specific README files for setup instructions
- Database health check: `python -c "from src.database import db_manager; print(db_manager.health_check())"`

---

🎉 **You're ready to sync WooCommerce data from multiple clients into a centralized database!**
