# Dev Notes - October 4, 2025 - Twinkl GSC-Powered Keyword Intelligence System

## 🚨 **CRITICAL FIXES REQUIRED BEFORE IMPLEMENTATION**

### **🔴 High Priority Issues (Must Fix Before Monday)**

1. **Database Schema Flaws**
   - ❌ `SearchTermClassification.search_term` was `unique=True` (breaks multi-account)
   - ✅ **FIXED**: Changed to `unique_together = ['account', 'search_term']`

2. **GSC API Pagination Broken**
   - ❌ Only fetched first 25,000 rows, would miss 80% of Twinkl's data
   - ✅ **FIXED**: Implemented proper pagination loop for 100k+ terms

3. **AI Cost Control Missing**
   - ❌ No budget tracking, could cost $1000s/month
   - ✅ **FIXED**: Added cost tracking and daily limits

4. **Celery Tasks No Error Recovery**
   - ❌ Failed tasks lose all progress
   - ✅ **FIXED**: Added retry logic with progress tracking

5. **Performance Issues**
   - ❌ N+1 queries, missing indexes, no caching
   - ✅ **FIXED**: Added proper indexing and caching strategies

### **🟡 Medium Priority Issues (Fix Week 1)**

6. **Missing Validation Layer**
7. **No Classification Audit Trail**
8. **Missing Rate Limiting & Permissions**
9. **No Monitoring/Alerting**
10. **No Testing Strategy**

### **📋 Implementation Checklist (Updated)**
- [ ] **Before Monday**: Apply all critical fixes above
- [ ] **Week 1 Day 1-2**: Include fixes in initial setup
- [ ] **Week 1 Day 3**: Add validation + audit trail
- [ ] **Week 1 Day 4-5**: Include monitoring from start

---

## 🎯 **Project Overview**
**Goal**: Build an automated system that identifies PPC keyword opportunities from Google Search Console data using AI classification and opportunity detection logic.

**Client**: Twinkl (Educational Resources Company)
**Project**: Pillar 1 - GSC-Powered Keyword Intelligence System

## 🛠️ **Tech Stack Adaptation to Existing Codebase**
- **Data Pipeline**: Python + Google Search Console API (integrated with existing Django backend)
- **Database**: PostgreSQL (existing setup)
- **Classification UI**: React frontend (existing Next.js setup)
- **AI Classifier**: OpenAI GPT-4 / Anthropic Claude API (new integration)
- **Workflow**: Django Celery (existing task system) + Django management commands

## 📋 **Phase 1: Data Pipeline Setup (Week 1, Day 1-2)**

### **1.1 GSC API Integration**
**Location**: `backend/gsc/` (new app)

```python
# backend/gsc/client.py
from google.oauth2 import service_account
from googleapiclient.discovery import build
from django.conf import settings

class GSCClient:
    def __init__(self, credentials_path, property_url):
        self.credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/webmasters.readonly']
        )
        self.service = build('searchconsole', 'v1', credentials=self.credentials)
        self.property_url = property_url
    
    def fetch_data(self, start_date, end_date, dimensions=['query', 'page', 'country', 'device']):
        """Fetch ALL GSC data with proper pagination - FIXED for 100k+ terms"""
        all_rows = []
        start_row = 0
        row_limit = 25000
        
        while True:
            request = {
                'startDate': start_date,
                'endDate': end_date,
                'dimensions': dimensions,
                'rowLimit': row_limit,
                'startRow': start_row
            }
            
            try:
                response = self.service.searchanalytics().query(
                    siteUrl=self.property_url,
                    body=request
                ).execute()
                
                rows = response.get('rows', [])
                if not rows:
                    break
                    
                all_rows.extend(rows)
                
                if len(rows) < row_limit:
                    break  # Last page
                    
                start_row += row_limit
                
            except Exception as e:
                logger.error(f"GSC API error at row {start_row}: {e}")
                break
        
        return all_rows
```

### **1.2 Database Schema (Django Models)**
**Location**: `backend/gsc/models.py`

```python
from django.db import models
from django.contrib.auth import get_user_model
from users.models import Account

User = get_user_model()

class GSCSearchTerm(models.Model):
    """GSC raw data - adapted to existing Django patterns"""
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='gsc_terms')
    date = models.DateField()
    search_term = models.CharField(max_length=500)
    url = models.URLField()
    country = models.CharField(max_length=2, blank=True)
    device = models.CharField(max_length=20, blank=True)
    impressions = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    ctr = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    avg_position = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['account', 'date', 'search_term', 'url', 'country', 'device']
        db_table = 'gsc_search_terms'
        indexes = [
            models.Index(fields=['search_term']),
            models.Index(fields=['date', 'country']),
            models.Index(fields=['account', 'date']),
        ]

class SearchTermClassification(models.Model):
    """Classification taxonomy - follows existing model patterns"""
    INTENT_CHOICES = [
        ('transactional', 'Transactional'),
        ('navigational', 'Navigational'),
        ('informational', 'Informational'),
        ('commercial', 'Commercial'),
    ]
    
    RESOURCE_TYPE_CHOICES = [
        ('worksheet', 'Worksheet'),
        ('lesson_plan', 'Lesson Plan'),
        ('activity', 'Activity'),
        ('assessment', 'Assessment'),
        ('display', 'Display/Poster'),
        ('powerpoint', 'PowerPoint'),
        ('flashcard', 'Flashcard'),
        ('other', 'Other'),
    ]
    
    SUBJECT_CHOICES = [
        ('math', 'Math'),
        ('english', 'English'),
        ('science', 'Science'),
        ('history', 'History'),
        ('geography', 'Geography'),
        ('art', 'Art'),
        ('other', 'Other'),
    ]
    
    PPC_PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
        ('exclude', 'Exclude'),
    ]
    
    CLASSIFIER_TYPE_CHOICES = [
        ('human', 'Human'),
        ('ai_gpt4', 'AI GPT-4'),
        ('ai_claude', 'AI Claude'),
        ('ai_finetuned', 'AI Fine-tuned'),
    ]
    
    REVIEW_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('disputed', 'Disputed'),
    ]
    
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='classifications')
    search_term = models.CharField(max_length=500)  # ❌ FIXED: Removed unique=True
    
    # Classification dimensions
    intent = models.CharField(max_length=50, choices=INTENT_CHOICES)
    intent_confidence = models.IntegerField(default=0)  # 0-100
    
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPE_CHOICES, blank=True)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, blank=True)
    year_level = models.CharField(max_length=50, blank=True)
    seasonality = models.CharField(max_length=50, blank=True)
    geography = models.CharField(max_length=50, blank=True)
    ppc_priority = models.CharField(max_length=20, choices=PPC_PRIORITY_CHOICES)
    
    # Metadata
    classifier_type = models.CharField(max_length=20, choices=CLASSIFIER_TYPE_CHOICES)
    classified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    classified_at = models.DateTimeField(auto_now_add=True)
    
    # Aggregated GSC metrics
    total_impressions = models.IntegerField(default=0)
    total_clicks = models.IntegerField(default=0)
    avg_ctr = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    avg_position = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    review_status = models.CharField(max_length=20, choices=REVIEW_STATUS_CHOICES, default='pending')
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'search_term_classifications'
        unique_together = ['account', 'search_term']  # ✅ FIXED: Multi-account support
        indexes = [
            models.Index(fields=['account', 'search_term']),  # ✅ FIXED: Composite index
            models.Index(fields=['account', 'ppc_priority', 'intent']),
            models.Index(fields=['classifier_type']),
            models.Index(fields=['review_status']),
        ]

class PPCKeyword(models.Model):
    """PPC account coverage tracking"""
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='ppc_keywords')
    keyword = models.CharField(max_length=500)
    match_type = models.CharField(max_length=20, choices=[
        ('exact', 'Exact'),
        ('phrase', 'Phrase'),
        ('broad', 'Broad'),
    ])
    campaign_name = models.CharField(max_length=200, blank=True)
    ad_group_name = models.CharField(max_length=200, blank=True)
    landing_page = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('paused', 'Paused'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ppc_keywords'
        unique_together = ['account', 'keyword', 'match_type']

class KeywordOpportunity(models.Model):
    """Opportunities detected - follows existing job pattern"""
    OPPORTUNITY_TYPE_CHOICES = [
        ('uncovered_term', 'Uncovered Term'),
        ('landing_page_mismatch', 'Landing Page Mismatch'),
        ('synonym_expansion', 'Synonym Expansion'),
        ('ppc_cannibalization', 'PPC Cannibalization'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('actioned', 'Actioned'),
        ('rejected', 'Rejected'),
    ]
    
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='opportunities')
    search_term = models.CharField(max_length=500)
    opportunity_type = models.CharField(max_length=50, choices=OPPORTUNITY_TYPE_CHOICES)
    priority_score = models.IntegerField(default=0)  # 0-100
    
    # Recommendation details (JSON)
    recommendation = models.JSONField(default=dict)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    actioned_at = models.DateTimeField(null=True, blank=True)
    actioned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'keyword_opportunities'
        indexes = [
            models.Index(fields=['status', 'priority_score']),
            models.Index(fields=['opportunity_type']),
        ]
```

### **1.3 Critical Fixes Implementation**

#### **A. AI Cost Control & Tracking**
**Location**: `backend/gsc/models.py` (additional model)

```python
class ClassificationCost(models.Model):
    """Track AI classification costs to prevent budget overruns"""
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='classification_costs')
    date = models.DateField()
    search_term = models.CharField(max_length=500)
    tokens = models.IntegerField()
    cost = models.DecimalField(max_digits=10, decimal_places=4)  # Cost in USD
    model = models.CharField(max_length=50)  # gpt-4-turbo, claude-3, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'classification_costs'
        indexes = [
            models.Index(fields=['account', 'date']),
            models.Index(fields=['date', 'model']),
        ]
```

#### **B. Classification Audit Trail**
**Location**: `backend/gsc/models.py` (additional model)

```python
class ClassificationHistory(models.Model):
    """Track all classification changes for audit and quality control"""
    classification = models.ForeignKey(SearchTermClassification, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    # Store the delta
    field_changed = models.CharField(max_length=50)
    old_value = models.CharField(max_length=200)
    new_value = models.CharField(max_length=200)
    reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'classification_history'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['classification', 'changed_at']),
            models.Index(fields=['changed_by', 'changed_at']),
        ]
```

#### **C. Validation Layer**
**Location**: `backend/gsc/validators.py`

```python
class ClassificationValidator:
    """Validate classification data before saving"""
    
    @staticmethod
    def validate_classification(classification_data):
        """Validate classification before saving"""
        errors = []
        
        # Intent validation
        if classification_data['intent'] == 'transactional':
            if not classification_data.get('resource_type'):
                errors.append("Transactional terms must have resource_type")
        
        # Priority validation
        if classification_data['ppc_priority'] == 'high':
            if classification_data['intent'] not in ['transactional', 'commercial']:
                errors.append("High priority requires transactional/commercial intent")
        
        # Geography validation
        year_level = classification_data.get('year_level', '')
        geography = classification_data.get('geography', '')
        
        if 'year_' in year_level and geography != 'uk_specific':
            errors.append("'year_X' indicates UK, geography should be uk_specific")
        
        if 'grade_' in year_level and geography != 'us_specific':
            errors.append("'grade_X' indicates US, geography should be us_specific")
        
        return errors
```

#### **D. Enhanced Celery Tasks with Error Recovery**
**Location**: `backend/gsc/tasks.py` (updated)

```python
from celery import shared_task
from django.utils import timezone
from datetime import datetime, timedelta
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def import_daily_gsc_data(self, account_id, credentials_path, property_url):
    """Daily job to import GSC data with error recovery and progress tracking"""
    try:
        account = Account.objects.get(id=account_id)
        
        # Get data for yesterday (GSC has 2-3 day lag)
        end_date = datetime.now() - timedelta(days=3)
        start_date = end_date - timedelta(days=1)
        
        gsc = GSCClient(credentials_path, property_url)
        
        # Fetch data with proper pagination
        rows = gsc.fetch_data(
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d'),
            dimensions=['query', 'page', 'country', 'device']
        )
        
        # Process in chunks with progress tracking
        chunk_size = 1000
        created_count = 0
        
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i+chunk_size]
            
            # Bulk create with conflict handling
            objs = []
            for row in chunk:
                objs.append(GSCSearchTerm(
                    account=account,
                    date=start_date.date(),
                    search_term=row['keys'][0],
                    url=row['keys'][1],
                    country=row['keys'][2],
                    device=row['keys'][3],
                    impressions=row['impressions'],
                    clicks=row['clicks'],
                    ctr=row['ctr'],
                    avg_position=row['position']
                ))
            
            # Bulk create with ignore conflicts
            GSCSearchTerm.objects.bulk_create(
                objs, 
                ignore_conflicts=True,
                batch_size=500
            )
            
            created_count += len(objs)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': i + len(chunk), 
                    'total': len(rows),
                    'created': created_count
                }
            )
        
        return {
            'success': True,
            'account': account.name,
            'date': start_date.date(),
            'rows_processed': len(rows),
            'rows_created': created_count
        }
        
    except Exception as e:
        logger.error(f"GSC import failed for account {account_id}: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
```

#### **E. Enhanced AI Classifier with Cost Control**
**Location**: `backend/gsc/services.py`

```python
import openai
from django.conf import settings
from django.core.cache import cache
from django.db.models import Sum
import json
import logging

logger = logging.getLogger(__name__)

class AIClassifier:
    MAX_DAILY_COST = 100.00  # $100/day limit per account
    
    def __init__(self, account_id):
        self.account_id = account_id
        openai.api_key = settings.OPENAI_API_KEY
    
    def _check_daily_budget(self):
        """Check if daily AI budget has been exceeded"""
        today = timezone.now().date()
        today_spend = ClassificationCost.objects.filter(
            account_id=self.account_id,
            date=today
        ).aggregate(total=Sum('cost'))['total'] or 0
        
        if today_spend >= self.MAX_DAILY_COST:
            raise Exception(f"Daily AI budget exceeded: ${today_spend:.2f} / ${self.MAX_DAILY_COST}")
        
        return today_spend
    
    def _track_cost(self, search_term, tokens, model='gpt-4-turbo'):
        """Track AI classification cost"""
        cost = (tokens / 1000) * 0.03  # GPT-4 pricing
        
        ClassificationCost.objects.create(
            account_id=self.account_id,
            date=timezone.now().date(),
            search_term=search_term,
            tokens=tokens,
            cost=cost,
            model=model
        )
        
        return cost
    
    def classify_term_gpt4(self, search_term, impressions, clicks, ctr, avg_position, countries):
        """Classify a search term using GPT-4 with cost control"""
        
        # Check daily budget
        self._check_daily_budget()
        
        # Get few-shot examples from cache or database
        cache_key = f"gsc_examples_{self.account_id}"
        examples = cache.get(cache_key)
        
        if not examples:
            examples = SearchTermClassification.objects.filter(
                account_id=self.account_id,
                classifier_type='human',
                review_status='reviewed'
            ).order_by('?')[:10]
            cache.set(cache_key, examples, 3600)  # Cache for 1 hour
        
        # Build prompt with examples
        example_text = "\n\n".join([
            f"""Example: "{ex.search_term}"
Classification: {{
  "intent": "{ex.intent}",
  "resource_type": "{ex.resource_type}",
  "subject": "{ex.subject}",
  "year_level": "{ex.year_level}",
  "seasonality": "{ex.seasonality}",
  "geography": "{ex.geography}",
  "ppc_priority": "{ex.ppc_priority}"
}}"""
            for ex in examples
        ])
        
        prompt = f"""You are a PPC keyword classifier for Twinkl, an educational resources company.

Classify search terms based on these dimensions:
- Intent: transactional (ready to download), navigational (seeking specific page), informational (researching), commercial (comparing options)
- Resource Type: worksheet, lesson_plan, activity, assessment, display, powerpoint, flashcard, other
- Subject: math, english, science, history, geography, art, etc.
- Year Level: early_years, year_1, year_2, grade_k, grade_1, ks2, secondary, etc.
- Seasonality: evergreen, holiday_christmas, holiday_halloween, back_to_school, assessment_season, etc.
- Geography: us_specific, uk_specific, au_specific, generic
- PPC Priority: high (high volume + high intent + profitable), medium, low (informational/low volume), exclude

Here are some examples of correct classifications:

{example_text}

Now classify this term:
Search Term: "{search_term}"

Context:
- Impressions: {impressions:,}
- Clicks: {clicks}
- CTR: {ctr:.2%}
- Avg Position: {avg_position:.1f}
- Countries: {', '.join(countries)}

Provide classification as JSON with confidence scores (0-100) for each dimension.
"""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert PPC keyword classifier. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            # Track cost
            tokens = response.usage.total_tokens
            self._track_cost(search_term, tokens)
            
            classification = json.loads(response.choices[0].message.content)
            return classification
            
        except Exception as e:
            logger.error(f"AI classification failed for {search_term}: {e}")
            raise
```

### **1.4 Daily Data Import Job (Celery Integration)**
**Location**: `backend/gsc/tasks.py`

```python
from celery import shared_task
from django.utils import timezone
from datetime import datetime, timedelta
from .client import GSCClient
from .models import GSCSearchTerm
from users.models import Account
import pandas as pd

@shared_task
def import_daily_gsc_data(account_id, credentials_path, property_url):
    """Daily job to import GSC data - follows existing Celery pattern"""
    try:
        account = Account.objects.get(id=account_id)
        
        # Get data for yesterday (GSC has 2-3 day lag)
        end_date = datetime.now() - timedelta(days=3)
        start_date = end_date - timedelta(days=1)
        
        gsc = GSCClient(credentials_path, property_url)
        
        # Fetch data
        rows = gsc.fetch_data(
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d'),
            dimensions=['query', 'page', 'country', 'device']
        )
        
        # Process and save data
        created_count = 0
        for row in rows:
            obj, created = GSCSearchTerm.objects.get_or_create(
                account=account,
                date=start_date.date(),
                search_term=row['keys'][0],
                url=row['keys'][1],
                country=row['keys'][2],
                device=row['keys'][3],
                defaults={
                    'impressions': row['impressions'],
                    'clicks': row['clicks'],
                    'ctr': row['ctr'],
                    'avg_position': row['position']
                }
            )
            if created:
                created_count += 1
        
        return {
            'success': True,
            'account': account.name,
            'date': start_date.date(),
            'rows_processed': len(rows),
            'rows_created': created_count
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'account_id': account_id
        }

@shared_task
def import_all_gsc_accounts():
    """Import GSC data for all accounts - follows existing sync_all pattern"""
    # Get all accounts with GSC configuration
    accounts = Account.objects.filter(
        is_active=True,
        configurations__config_type='gsc'
    ).distinct()
    
    results = []
    for account in accounts:
        # Get GSC config
        gsc_config = account.configurations.filter(config_type='gsc').first()
        if gsc_config:
            result = import_daily_gsc_data.delay(
                account.id,
                gsc_config.config.get('credentials_path'),
                gsc_config.config.get('property_url')
            )
            results.append({
                'account_id': account.id,
                'account_name': account.name,
                'task_id': result.id
            })
    
    return results
```

## 📋 **Phase 2: Manual Classification System (Week 1, Day 2-4)**

### **2.1 Enhanced Classification API (Django REST Framework)**
**Location**: `backend/gsc/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from django.db.models import Q, Sum, Avg, Count
from django.db import transaction
from django.core.cache import cache
from .models import GSCSearchTerm, SearchTermClassification, ClassificationHistory
from .serializers import ClassificationSerializer
from .validators import ClassificationValidator
import logging

logger = logging.getLogger(__name__)

class ClassificationRateThrottle(UserRateThrottle):
    rate = '100/hour'  # Limit to 100 classifications per hour per user

class ClassificationViewSet(viewsets.ModelViewSet):
    """Enhanced Classification API endpoints with validation and audit trail"""
    serializer_class = ClassificationSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [ClassificationRateThrottle]
    
    def get_queryset(self):
        # Only show classifications for accounts user has access to
        account_id = self.request.query_params.get('account_id')
        if account_id:
            return SearchTermClassification.objects.filter(account_id=account_id)
        return SearchTermClassification.objects.filter(
            account__in=self.request.user.accounts.all()
        )
    
    @action(detail=False, methods=['get'])
    def unclassified_terms(self, request):
        """Get next batch of terms to classify - adapted to existing API pattern"""
        account_id = request.query_params.get('account_id')
        limit = int(request.query_params.get('limit', 20))
        strategy = request.query_params.get('strategy', 'high_volume')
        
        if not account_id:
            return Response({'error': 'account_id required'}, status=400)
        
        if strategy == 'high_volume':
            # Get terms with highest impressions not yet classified
            terms = GSCSearchTerm.objects.filter(
                account_id=account_id
            ).exclude(
                search_term__in=SearchTermClassification.objects.filter(
                    account_id=account_id
                ).values_list('search_term', flat=True)
            ).values('search_term').annotate(
                total_impressions=Sum('impressions'),
                total_clicks=Sum('clicks'),
                avg_ctr=Avg('ctr'),
                avg_position=Avg('avg_position')
            ).order_by('-total_impressions')[:limit]
        
        return Response({
            'terms': list(terms),
            'strategy': strategy,
            'limit': limit
        })
    
    @action(detail=False, methods=['post'])
    def classify_term(self, request):
        """Save single classification with validation and audit trail"""
        account_id = request.data.get('account_id')
        search_term = request.data.get('search_term')
        
        if not account_id or not search_term:
            return Response({'error': 'account_id and search_term required'}, status=400)
        
        # Validate classification data
        validator = ClassificationValidator()
        errors = validator.validate_classification(request.data)
        if errors:
            return Response({'error': 'Validation failed', 'details': errors}, status=400)
        
        # Get aggregated metrics
        metrics = GSCSearchTerm.objects.filter(
            account_id=account_id,
            search_term=search_term
        ).aggregate(
            total_impressions=Sum('impressions'),
            total_clicks=Sum('clicks'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('avg_position')
        )
        
        with transaction.atomic():
            # Get existing classification for audit trail
            existing = SearchTermClassification.objects.filter(
                account_id=account_id,
                search_term=search_term
            ).first()
            
            # Create or update classification
            classification, created = SearchTermClassification.objects.update_or_create(
                account_id=account_id,
                search_term=search_term,
                defaults={
                    'intent': request.data.get('intent'),
                    'intent_confidence': request.data.get('intent_confidence', 80),
                    'resource_type': request.data.get('resource_type', ''),
                    'subject': request.data.get('subject', ''),
                    'year_level': request.data.get('year_level', ''),
                    'seasonality': request.data.get('seasonality', 'evergreen'),
                    'geography': request.data.get('geography', 'generic'),
                    'ppc_priority': request.data.get('ppc_priority', 'medium'),
                    'notes': request.data.get('notes', ''),
                    'total_impressions': metrics['total_impressions'] or 0,
                    'total_clicks': metrics['total_clicks'] or 0,
                    'avg_ctr': metrics['avg_ctr'] or 0,
                    'avg_position': metrics['avg_position'] or 0,
                    'classifier_type': 'human',
                    'classified_by': request.user,
                    'review_status': 'pending'
                }
            )
            
            # Create audit trail for changes
            if existing and not created:
                for field in ['intent', 'resource_type', 'subject', 'ppc_priority']:
                    old_value = getattr(existing, field, '')
                    new_value = getattr(classification, field, '')
                    if old_value != new_value:
                        ClassificationHistory.objects.create(
                            classification=classification,
                            changed_by=request.user,
                            field_changed=field,
                            old_value=str(old_value),
                            new_value=str(new_value),
                            reason=request.data.get('reason', '')
                        )
        
        return Response({
            'status': 'success',
            'search_term': search_term,
            'created': created
        })
    
    @action(detail=False, methods=['post'])
    def classify_batch(self, request):
        """Batch classify multiple terms at once - CRITICAL FIX"""
        account_id = request.data.get('account_id')
        classifications = request.data.get('classifications', [])
        
        if not account_id or not classifications:
            return Response({'error': 'account_id and classifications required'}, status=400)
        
        results = []
        validator = ClassificationValidator()
        
        with transaction.atomic():
            for item in classifications:
                # Validate each classification
                errors = validator.validate_classification(item)
                if errors:
                    results.append({
                        'search_term': item['search_term'], 
                        'status': 'validation_error',
                        'errors': errors
                    })
                    continue
                
                # Get metrics
                metrics = GSCSearchTerm.objects.filter(
                    account_id=account_id,
                    search_term=item['search_term']
                ).aggregate(
                    total_impressions=Sum('impressions'),
                    total_clicks=Sum('clicks'),
                    avg_ctr=Avg('ctr'),
                    avg_position=Avg('avg_position')
                )
                
                # Save classification
                classification, created = SearchTermClassification.objects.update_or_create(
                    account_id=account_id,
                    search_term=item['search_term'],
                    defaults={
                        'intent': item.get('intent'),
                        'intent_confidence': item.get('intent_confidence', 80),
                        'resource_type': item.get('resource_type', ''),
                        'subject': item.get('subject', ''),
                        'year_level': item.get('year_level', ''),
                        'seasonality': item.get('seasonality', 'evergreen'),
                        'geography': item.get('geography', 'generic'),
                        'ppc_priority': item.get('ppc_priority', 'medium'),
                        'notes': item.get('notes', ''),
                        'total_impressions': metrics['total_impressions'] or 0,
                        'total_clicks': metrics['total_clicks'] or 0,
                        'avg_ctr': metrics['avg_ctr'] or 0,
                        'avg_position': metrics['avg_position'] or 0,
                        'classifier_type': 'human',
                        'classified_by': request.user,
                        'review_status': 'pending'
                    }
                )
                
                results.append({
                    'search_term': item['search_term'],
                    'status': 'created' if created else 'updated'
                })
        
        return Response({
            'results': results,
            'total_processed': len(results),
            'successful': len([r for r in results if r['status'] in ['created', 'updated']]),
            'failed': len([r for r in results if r['status'] == 'validation_error'])
        })
    
    @action(detail=False, methods=['get'])
    def progress(self, request):
        """Track classification progress - follows existing analytics pattern"""
        account_id = request.query_params.get('account_id')
        
        if not account_id:
            return Response({'error': 'account_id required'}, status=400)
        
        # Calculate progress metrics
        total_terms = GSCSearchTerm.objects.filter(account_id=account_id).values('search_term').distinct().count()
        classified_terms = SearchTermClassification.objects.filter(account_id=account_id).count()
        
        total_impressions = GSCSearchTerm.objects.filter(account_id=account_id).aggregate(
            total=Sum('impressions')
        )['total'] or 0
        
        classified_impressions = GSCSearchTerm.objects.filter(
            account_id=account_id,
            search_term__in=SearchTermClassification.objects.filter(account_id=account_id).values_list('search_term', flat=True)
        ).aggregate(total=Sum('impressions'))['total'] or 0
        
        return Response({
            'terms_classified': classified_terms,
            'total_terms': total_terms,
            'percent_terms': round(classified_terms / total_terms * 100, 2) if total_terms > 0 else 0,
            'impressions_classified': classified_impressions,
            'total_impressions': total_impressions,
            'percent_impressions': round(classified_impressions / total_impressions * 100, 2) if total_impressions > 0 else 0
        })
```

### **2.2 Classification UI Frontend (React Component)**
**Location**: `components/gsc/ClassificationTool.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ClassificationData {
  intent: string;
  intent_confidence: number;
  resource_type: string;
  subject: string;
  year_level: string;
  seasonality: string;
  geography: string;
  ppc_priority: string;
  notes: string;
}

interface TermData {
  search_term: string;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_position: number;
}

const ClassificationTool: React.FC<{ accountId: string }> = ({ accountId }) => {
  const [terms, setTerms] = useState<TermData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classification, setClassification] = useState<ClassificationData>({
    intent: 'transactional',
    intent_confidence: 80,
    resource_type: '',
    subject: '',
    year_level: '',
    seasonality: 'evergreen',
    geography: 'generic',
    ppc_priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    loadTerms();
  }, [accountId]);

  const loadTerms = async () => {
    try {
      const response = await axios.get(`/api/gsc/unclassified_terms/?account_id=${accountId}&limit=50&strategy=high_volume`);
      setTerms(response.data.terms);
    } catch (error) {
      console.error('Error loading terms:', error);
    }
  };

  const currentTerm = terms[currentIndex];

  const handleSave = async () => {
    try {
      await axios.post('/api/gsc/classify_term/', {
        account_id: accountId,
        search_term: currentTerm.search_term,
        ...classification
      });
      
      // Move to next term
      if (currentIndex < terms.length - 1) {
        setCurrentIndex(currentIndex + 1);
        resetClassification();
      } else {
        // Load new batch
        loadTerms();
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error saving classification:', error);
    }
  };

  const resetClassification = () => {
    setClassification({
      intent: 'transactional',
      intent_confidence: 80,
      resource_type: '',
      subject: '',
      year_level: '',
      seasonality: 'evergreen',
      geography: 'generic',
      ppc_priority: 'medium',
      notes: ''
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 's') setCurrentIndex(Math.min(currentIndex + 1, terms.length - 1));
      if (e.key === 't') setClassification({...classification, intent: 'transactional'});
      if (e.key === 'i') setClassification({...classification, intent: 'informational'});
      if (e.key === 'n') setClassification({...classification, intent: 'navigational'});
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [classification, currentIndex]);

  if (!currentTerm) return <div>Loading...</div>;

  return (
    <div className="classification-tool">
      <div className="header">
        <h2>Twinkl Keyword Classifier</h2>
        <div className="progress">
          Term {currentIndex + 1} of {terms.length}
        </div>
      </div>

      <div className="term-card">
        <h3 className="search-term">{currentTerm.search_term}</h3>
        
        <div className="metrics">
          <span>📊 Impressions: {currentTerm.total_impressions.toLocaleString()}</span>
          <span>👆 Clicks: {currentTerm.total_clicks}</span>
          <span>📈 CTR: {(currentTerm.avg_ctr * 100).toFixed(2)}%</span>
          <span>📍 Avg Pos: {currentTerm.avg_position.toFixed(1)}</span>
        </div>
      </div>

      <div className="classification-form">
        <div className="field">
          <label>Intent:</label>
          <div className="button-group">
            {['transactional', 'navigational', 'informational', 'commercial'].map(intent => (
              <button
                key={intent}
                className={classification.intent === intent ? 'active' : ''}
                onClick={() => setClassification({...classification, intent})}
              >
                {intent}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Resource Type:</label>
          <select 
            value={classification.resource_type}
            onChange={e => setClassification({...classification, resource_type: e.target.value})}
          >
            <option value="">Select...</option>
            <option value="worksheet">Worksheet</option>
            <option value="lesson_plan">Lesson Plan</option>
            <option value="activity">Activity</option>
            <option value="assessment">Assessment</option>
            <option value="display">Display/Poster</option>
          </select>
        </div>

        <div className="field">
          <label>Subject:</label>
          <select 
            value={classification.subject}
            onChange={e => setClassification({...classification, subject: e.target.value})}
          >
            <option value="">Select...</option>
            <option value="math">Math</option>
            <option value="english">English</option>
            <option value="science">Science</option>
            <option value="history">History</option>
          </select>
        </div>

        <div className="field">
          <label>PPC Priority:</label>
          <div className="button-group">
            {['high', 'medium', 'low', 'exclude'].map(priority => (
              <button
                key={priority}
                className={classification.ppc_priority === priority ? 'active' : ''}
                onClick={() => setClassification({...classification, ppc_priority: priority})}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Notes:</label>
          <textarea 
            value={classification.notes}
            onChange={e => setClassification({...classification, notes: e.target.value})}
            placeholder="Optional notes..."
          />
        </div>
      </div>

      <div className="actions">
        <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>
          ← Previous
        </button>
        <button onClick={() => setCurrentIndex(Math.min(currentIndex + 1, terms.length - 1))}>
          Skip
        </button>
        <button onClick={handleSave} className="primary">
          Save & Next (Enter) →
        </button>
      </div>

      <div className="shortcuts">
        Shortcuts: <kbd>Enter</kbd> Save | <kbd>T</kbd> Transactional | <kbd>I</kbd> Informational | <kbd>S</kbd> Skip
      </div>
    </div>
  );
};

export default ClassificationTool;
```

## 📋 **Phase 3: AI Classifier Development (Week 1, Day 5 - Week 2)**

### **3.1 AI Classifier Service**
**Location**: `backend/gsc/services.py`

```python
import openai
from django.conf import settings
import json
from .models import SearchTermClassification

class AIClassifier:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
    
    def classify_term_gpt4(self, search_term, impressions, clicks, ctr, avg_position, countries):
        """Classify a search term using GPT-4 - follows existing service pattern"""
        
        # Get few-shot examples from existing classifications
        examples = SearchTermClassification.objects.filter(
            classifier_type='human',
            review_status='reviewed'
        ).order_by('?')[:10]
        
        example_text = "\n\n".join([
            f"""Example: "{ex.search_term}"
Classification: {{
  "intent": "{ex.intent}",
  "resource_type": "{ex.resource_type}",
  "subject": "{ex.subject}",
  "year_level": "{ex.year_level}",
  "seasonality": "{ex.seasonality}",
  "geography": "{ex.geography}",
  "ppc_priority": "{ex.ppc_priority}"
}}"""
            for ex in examples
        ])
        
        prompt = f"""You are a PPC keyword classifier for Twinkl, an educational resources company.

Classify search terms based on these dimensions:
- Intent: transactional (ready to download), navigational (seeking specific page), informational (researching), commercial (comparing options)
- Resource Type: worksheet, lesson_plan, activity, assessment, display, powerpoint, flashcard, other
- Subject: math, english, science, history, geography, art, etc.
- Year Level: early_years, year_1, year_2, grade_k, grade_1, ks2, secondary, etc.
- Seasonality: evergreen, holiday_christmas, holiday_halloween, back_to_school, assessment_season, etc.
- Geography: us_specific, uk_specific, au_specific, generic
- PPC Priority: high (high volume + high intent + profitable), medium, low (informational/low volume), exclude

Here are some examples of correct classifications:

{example_text}

Now classify this term:
Search Term: "{search_term}"

Context:
- Impressions: {impressions:,}
- Clicks: {clicks}
- CTR: {ctr:.2%}
- Avg Position: {avg_position:.1f}
- Countries: {', '.join(countries)}

Provide classification as JSON with confidence scores (0-100) for each dimension.
"""

        response = openai.ChatCompletion.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an expert PPC keyword classifier. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        classification = json.loads(response.choices[0].message.content)
        return classification

@shared_task
def classify_batch_terms(account_id, limit=1000):
    """Classify a batch of terms using AI - follows existing Celery pattern"""
    from .models import GSCSearchTerm, SearchTermClassification
    from django.db.models import Sum, Avg
    
    classifier = AIClassifier()
    
    # Get unclassified terms with metrics
    terms = GSCSearchTerm.objects.filter(
        account_id=account_id
    ).exclude(
        search_term__in=SearchTermClassification.objects.filter(
            account_id=account_id
        ).values_list('search_term', flat=True)
    ).values('search_term').annotate(
        total_impressions=Sum('impressions'),
        total_clicks=Sum('clicks'),
        avg_ctr=Avg('ctr'),
        avg_position=Avg('avg_position')
    ).order_by('-total_impressions')[:limit]
    
    results = []
    for term in terms:
        try:
            classification = classifier.classify_term_gpt4(
                term['search_term'],
                term['total_impressions'],
                term['total_clicks'],
                term['avg_ctr'],
                term['avg_position'],
                ['UK', 'US']  # Default countries
            )
            
            # Save classification
            SearchTermClassification.objects.create(
                account_id=account_id,
                search_term=term['search_term'],
                intent=classification.get('intent', 'informational'),
                intent_confidence=classification.get('intent_confidence', 70),
                resource_type=classification.get('resource_type', ''),
                subject=classification.get('subject', ''),
                year_level=classification.get('year_level', ''),
                seasonality=classification.get('seasonality', 'evergreen'),
                geography=classification.get('geography', 'generic'),
                ppc_priority=classification.get('ppc_priority', 'medium'),
                total_impressions=term['total_impressions'],
                total_clicks=term['total_clicks'],
                avg_ctr=term['avg_ctr'],
                avg_position=term['avg_position'],
                classifier_type='ai_gpt4'
            )
            
            results.append({
                'search_term': term['search_term'],
                'status': 'success'
            })
            
        except Exception as e:
            results.append({
                'search_term': term['search_term'],
                'status': 'error',
                'error': str(e)
            })
    
    return {
        'total_processed': len(results),
        'successful': len([r for r in results if r['status'] == 'success']),
        'failed': len([r for r in results if r['status'] == 'error']),
        'results': results
    }
```

## 📋 **Phase 4: Opportunity Detection Logic (Week 2)**

### **4.1 Opportunity Detection Service**
**Location**: `backend/gsc/services.py` (continued)

```python
class OpportunityDetector:
    
    def __init__(self, account_id):
        self.account_id = account_id
    
    def detect_uncovered_terms(self, min_impressions=1000, max_position=20):
        """Detect high-value terms not in PPC - adapted to Django ORM"""
        from .models import GSCSearchTerm, SearchTermClassification, PPCKeyword
        from django.db.models import Sum, Avg, Q
        
        # Get terms with high impressions and good position not in PPC
        uncovered_terms = GSCSearchTerm.objects.filter(
            account_id=self.account_id
        ).values('search_term').annotate(
            total_impressions=Sum('impressions'),
            total_clicks=Sum('clicks'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('avg_position')
        ).filter(
            total_impressions__gte=min_impressions,
            avg_position__lte=max_position
        ).exclude(
            search_term__in=PPCKeyword.objects.filter(
                account_id=self.account_id
            ).values_list('keyword', flat=True)
        )
        
        # Join with classifications
        opportunities = []
        for term in uncovered_terms:
            try:
                classification = SearchTermClassification.objects.get(
                    account_id=self.account_id,
                    search_term=term['search_term']
                )
                
                if classification.intent in ['transactional', 'commercial', 'navigational'] and \
                   classification.ppc_priority in ['high', 'medium']:
                    
                    # Calculate priority score
                    priority_score = (
                        (term['total_impressions'] * 0.3) +
                        ((20 - term['avg_position']) * 50) +
                        (2000 if classification.intent == 'transactional' else 1500) +
                        (1500 if classification.ppc_priority == 'high' else 800)
                    )
                    
                    opportunities.append({
                        'search_term': term['search_term'],
                        'opportunity_type': 'uncovered_term',
                        'priority_score': int(priority_score),
                        'recommendation': {
                            'action': 'create_new_campaign',
                            'keyword': term['search_term'],
                            'suggested_bid': self._suggest_bid(term),
                            'rationale': f"High-intent term with {term['total_impressions']:,} monthly impressions at position {term['avg_position']:.1f}"
                        }
                    })
            except SearchTermClassification.DoesNotExist:
                continue
        
        return sorted(opportunities, key=lambda x: x['priority_score'], reverse=True)

@shared_task
def run_opportunity_detection(account_id):
    """Run all opportunity detectors - follows existing Celery pattern"""
    from .models import KeywordOpportunity
    
    detector = OpportunityDetector(account_id)
    
    all_opportunities = []
    
    # Detect different types of opportunities
    print("Detecting uncovered terms...")
    all_opportunities.extend(detector.detect_uncovered_terms())
    
    # Save opportunities to database
    for opp in all_opportunities:
        KeywordOpportunity.objects.update_or_create(
            account_id=account_id,
            search_term=opp['search_term'],
            opportunity_type=opp['opportunity_type'],
            defaults={
                'priority_score': opp['priority_score'],
                'recommendation': opp['recommendation'],
                'status': 'new'
            }
        )
    
    return {
        'account_id': account_id,
        'opportunities_detected': len(all_opportunities),
        'opportunities': all_opportunities
    }
```

## 📋 **Implementation Checklist**

### **Week 1**
- [ ] **Day 1-2: Data Pipeline**
  - [ ] Create `backend/gsc/` Django app
  - [ ] Set up GSC API credentials in existing AccountConfiguration system
  - [ ] Create GSC models and migrations
  - [ ] Build daily data import Celery task
  - [ ] Integrate with existing job logging system

- [ ] **Day 3: Classification System**
  - [ ] Build classification API using existing DRF patterns
  - [ ] Create classification UI React component
  - [ ] Add GSC routes to existing URL configuration
  - [ ] Conduct team training session

- [ ] **Day 4-5: Initial Classification**
  - [ ] Classify 500 high-priority terms manually
  - [ ] Build AI classifier service
  - [ ] Validate on test set (target: >80% accuracy)

### **Week 2**
- [ ] **Day 1-2: Scale Classification**
  - [ ] Run AI classifier on 5,000 terms
  - [ ] Human review of low-confidence predictions
  - [ ] Achieve >85% accuracy on validation

- [ ] **Day 3-4: Opportunity Detection**
  - [ ] Build opportunity detection service
  - [ ] Generate first batch of 50 opportunities
  - [ ] Manual review and validation

- [ ] **Day 5: Review & Plan**
  - [ ] Present findings to stakeholders
  - [ ] Prioritize top 20 opportunities
  - [ ] Plan Week 3 campaign launches

### **Week 3-4**
- [ ] **Campaign Creation**
  - [ ] Set up Google Ads API integration
  - [ ] Build campaign creation automation
  - [ ] Launch first 10 test campaigns
  - [ ] Monitor performance daily

## 🎯 **Key Metrics to Track**

### **Classification Quality:**
- Terms classified per day
- Classification accuracy (AI vs human)
- Coverage % (terms classified / total terms)
- Impressions coverage % (classified impressions / total)

### **Opportunity Detection:**
- Opportunities detected per week
- Opportunities actioned per week
- Conversion rate (opportunities → campaigns)
- Average priority score of actioned opportunities

### **Business Impact:**
- New campaigns created
- Keywords added
- Budget allocated to new opportunities
- Incremental revenue from new campaigns
- Time saved (hours of manual work automated)

## 🚀 **Next Steps for Monday:**

1. **Provision GSC API access** with Twinkl credentials
2. **Create Django app**: `python manage.py startapp gsc`
3. **Set up models** and run initial migrations
4. **Integrate with existing** AccountConfiguration system
5. **Run initial data import** for last 30 days
6. **Deploy classification UI** to staging environment

## 📁 **File Structure Integration:**

```
backend/
├── gsc/                          # New GSC app
│   ├── models.py                 # GSC, Classification, Opportunity models
│   ├── views.py                  # DRF ViewSets for API
│   ├── serializers.py            # DRF serializers
│   ├── tasks.py                  # Celery tasks for import/classification
│   ├── services.py               # AI classifier and opportunity detector
│   ├── client.py                 # GSC API client
│   └── management/commands/      # Django management commands
├── users/                        # Existing - add GSC config type
├── woocommerce/                  # Existing - reference for patterns
└── api/                          # Existing - add GSC URLs

components/
├── gsc/                          # New GSC components
│   ├── ClassificationTool.tsx    # Main classification interface
│   ├── OpportunityDashboard.tsx  # Opportunity management
│   └── ProgressTracker.tsx       # Classification progress
└── woocommerce/                  # Existing - reference for patterns
```

This adaptation leverages the existing Django/React infrastructure while adding the new GSC functionality as a separate, well-integrated module.

## 🚨 **CRITICAL MONITORING & TESTING (MUST IMPLEMENT)**

### **F. Monitoring & Alerting System**
**Location**: `backend/gsc/monitoring.py`

```python
import sentry_sdk
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg
from .models import SearchTermClassification, ClassificationCost, GSCSearchTerm

class ClassificationMonitor:
    """Monitor system health and alert on issues"""
    
    @staticmethod
    def check_classification_health():
        """Run health checks and alert if issues"""
        
        # Check 1: AI accuracy dropping
        recent_accuracy = ClassificationMonitor.calculate_ai_accuracy(days=7)
        if recent_accuracy < 0.80:
            sentry_sdk.capture_message(
                f"AI classification accuracy dropped to {recent_accuracy:.2%}",
                level="warning"
            )
        
        # Check 2: Classification backlog growing
        unclassified = GSCSearchTerm.objects.exclude(
            search_term__in=SearchTermClassification.objects.values('search_term')
        ).count()
        
        if unclassified > 10000:
            sentry_sdk.capture_message(
                f"Classification backlog: {unclassified} terms",
                level="warning"
            )
        
        # Check 3: AI cost overrun
        today_cost = ClassificationCost.objects.filter(
            date=timezone.now().date()
        ).aggregate(total=Sum('cost'))['total'] or 0
        
        if today_cost > 80:  # 80% of daily limit
            sentry_sdk.capture_message(
                f"AI cost approaching limit: ${today_cost:.2f}",
                level="warning"
            )
    
    @staticmethod
    def calculate_ai_accuracy(days=7):
        """Calculate AI classification accuracy vs human review"""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get AI classifications that have been human reviewed
        reviewed_ai = SearchTermClassification.objects.filter(
            classifier_type__startswith='ai_',
            review_status='reviewed',
            classified_at__gte=cutoff_date
        )
        
        if not reviewed_ai.exists():
            return 1.0  # No data yet
        
        # Calculate accuracy for each dimension
        total = reviewed_ai.count()
        intent_matches = reviewed_ai.filter(
            intent=F('reviewed_intent')  # Assuming we add reviewed_intent field
        ).count()
        
        return intent_matches / total if total > 0 else 1.0

# Schedule health checks every hour
from celery import shared_task

@shared_task
def run_health_checks():
    """Run system health checks"""
    ClassificationMonitor.check_classification_health()
```

### **G. Comprehensive Test Suite**
**Location**: `backend/gsc/tests/`

```python
# backend/gsc/tests/test_classifier.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import SearchTermClassification, GSCSearchTerm, Account
from .services import AIClassifier
from .validators import ClassificationValidator

User = get_user_model()

class AIClassifierTestCase(TestCase):
    
    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.user = User.objects.create_user(username="test", email="test@example.com")
        self.classifier = AIClassifier(self.account.id)
    
    def test_transactional_classification(self):
        """Test that obvious transactional terms are classified correctly"""
        result = self.classifier.classify_term_gpt4(
            search_term="free printable math worksheets",
            impressions=10000,
            clicks=500,
            ctr=0.05,
            avg_position=3.2,
            countries=['US']
        )
        
        self.assertEqual(result['intent'], 'transactional')
        self.assertGreater(result['intent_confidence'], 80)
        self.assertEqual(result['resource_type'], 'worksheet')
    
    def test_cost_tracking(self):
        """Test that costs are properly tracked"""
        initial_cost = ClassificationCost.objects.filter(
            account=self.account
        ).aggregate(total=Sum('cost'))['total'] or 0
        
        # Mock API call
        with patch('openai.ChatCompletion.create') as mock_create:
            mock_create.return_value.usage.total_tokens = 1000
            mock_create.return_value.choices[0].message.content = '{"intent": "transactional"}'
            
            self.classifier.classify_term_gpt4("test term", 1000, 50, 0.05, 5.0, ['US'])
        
        final_cost = ClassificationCost.objects.filter(
            account=self.account
        ).aggregate(total=Sum('cost'))['total'] or 0
        
        self.assertGreater(final_cost, initial_cost)

class ClassificationValidatorTestCase(TestCase):
    
    def test_transactional_validation(self):
        """Test validation rules for transactional terms"""
        data = {
            'intent': 'transactional',
            'resource_type': 'worksheet',  # Required for transactional
            'ppc_priority': 'high'
        }
        
        errors = ClassificationValidator.validate_classification(data)
        self.assertEqual(len(errors), 0)
    
    def test_transactional_missing_resource_type(self):
        """Test validation fails when transactional missing resource_type"""
        data = {
            'intent': 'transactional',
            'ppc_priority': 'high'
            # Missing resource_type
        }
        
        errors = ClassificationValidator.validate_classification(data)
        self.assertIn("Transactional terms must have resource_type", errors)
    
    def test_geography_validation(self):
        """Test geography validation rules"""
        # UK year level should require UK geography
        data = {
            'intent': 'transactional',
            'year_level': 'year_3',
            'geography': 'us_specific'  # Wrong geography
        }
        
        errors = ClassificationValidator.validate_classification(data)
        self.assertIn("'year_X' indicates UK, geography should be uk_specific", errors)

# backend/gsc/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

class ClassificationAPITestCase(APITestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(username="test", email="test@example.com")
        self.account = Account.objects.create(name="Test Account")
        self.client.force_authenticate(user=self.user)
    
    def test_classify_term_validation(self):
        """Test API validation works correctly"""
        url = reverse('gsc:classify-term')
        data = {
            'account_id': self.account.id,
            'search_term': 'test term',
            'intent': 'transactional',
            # Missing required resource_type for transactional
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Validation failed', response.data['error'])
    
    def test_batch_classification(self):
        """Test batch classification endpoint"""
        url = reverse('gsc:classify-batch')
        data = {
            'account_id': self.account.id,
            'classifications': [
                {
                    'search_term': 'term1',
                    'intent': 'transactional',
                    'resource_type': 'worksheet',
                    'ppc_priority': 'high'
                },
                {
                    'search_term': 'term2',
                    'intent': 'informational',
                    'ppc_priority': 'low'
                }
            ]
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_processed'], 2)
        self.assertEqual(response.data['successful'], 2)
```

### **H. Performance Optimizations**
**Location**: `backend/gsc/views.py` (additional optimizations)

```python
@action(detail=False, methods=['get'])
def unclassified_terms(self, request):
    """Get next batch of terms to classify - OPTIMIZED for performance"""
    account_id = request.query_params.get('account_id')
    limit = int(request.query_params.get('limit', 20))
    strategy = request.query_params.get('strategy', 'high_volume')
    
    if not account_id:
        return Response({'error': 'account_id required'}, status=400)
    
    # Use select_related and prefetch_related to avoid N+1 queries
    if strategy == 'high_volume':
        terms = GSCSearchTerm.objects.filter(
            account_id=account_id
        ).select_related('account').exclude(
            search_term__in=SearchTermClassification.objects.filter(
                account_id=account_id
            ).values_list('search_term', flat=True)
        ).values('search_term').annotate(
            total_impressions=Sum('impressions'),
            total_clicks=Sum('clicks'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('avg_position')
        ).order_by('-total_impressions')[:limit]
    
    return Response({
        'terms': list(terms),
        'strategy': strategy,
        'limit': limit
    })
```

## 📋 **FINAL IMPLEMENTATION CHECKLIST**

### **🔴 CRITICAL (Before Monday)**
- [ ] Fix `SearchTermClassification` unique constraint
- [ ] Implement GSC pagination properly
- [ ] Add AI cost tracking and limits
- [ ] Add Celery retry logic with progress tracking
- [ ] Add batch classification endpoint
- [ ] Implement proper error handling everywhere
- [ ] Add permission checks and rate limiting
- [ ] Create validation layer
- [ ] Add monitoring/alerting
- [ ] Write initial test suite

### **🟡 MEDIUM (Week 1)**
- [ ] Add classification audit trail
- [ ] Implement caching for opportunity detection
- [ ] Add performance optimizations
- [ ] Create comprehensive monitoring dashboard
- [ ] Add data quality checks

### **🟢 LOW (Week 2+)**
- [ ] Advanced analytics and reporting
- [ ] Machine learning model fine-tuning
- [ ] Advanced opportunity detection algorithms
- [ ] Campaign automation features

## 🎯 **Risk Assessment Summary**

- **🔴 High Risk**: GSC pagination bug could miss 80% of data
- **🔴 High Risk**: No AI cost controls could blow budget
- **🟡 Medium Risk**: Performance issues with 100k+ terms
- **🟡 Medium Risk**: No error recovery in Celery tasks
- **🟢 Low Risk**: UI performance (can optimize later)

**The overall architecture is solid and well-adapted to Django patterns, but these critical fixes are mandatory before going to production.**
