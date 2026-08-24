#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

with open('en.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

data['statistics'] = {
    'title': 'Statistics',
    'intelligence': 'Intelligence',
    'subtitle': 'Understand where your money comes from and how fast it arrives.',
    'last7d': 'Last 7 days',
    'last30d': 'Last 30 days',
    'last90d': 'Last 90 days',
    'yearToDate': 'Year to date',
    'emptyTitle': 'No statistics yet',
    'emptyDesc': 'Upload your bank statements and provider reports to see your provider health scorecard, card type breakdown, and monthly trends.'
}

data['profitability'] = {
    'title': 'Profitability',
    'intelligence': 'Business Intelligence',
    'subtitle': 'See if your store is actually making money. Revenue minus provider fees minus costs equals true profit.',
    'emptyTitle': 'No store data yet',
    'emptyDesc': 'Complete your store setup and upload transaction data to see profitability analysis.',
    'analyzing': 'Analyzing:',
    'monthlyRevenue': 'Monthly Revenue',
    'providerFees': 'Provider Fees',
    'totalCosts': 'Total Costs',
    'netProfit': 'Net Profit',
    'margin': 'margin',
    'monthlyCosts': 'Monthly Costs',
    'addCost': '+ Add Cost',
    'costName': 'Cost Name',
    'amount': 'Amount (€)',
    'frequency': 'Frequency',
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'add': 'Add',
    'noCosts': 'No costs added yet. Click "+ Add Cost" to start tracking your expenses.',
    'cost': 'Cost',
    'monthlyEquiv': 'Monthly Equiv.',
    'totalMonthlyCosts': 'Total Monthly Costs'
}

data['reports'] = {
    'title': 'Reports',
    'subtitle': 'Generate and download professional reports for your accountant, bank or payment providers.',
    'store': 'Store:',
    'download': 'Download',
    'records': 'records',
    'usage': 'Report Usage',
    'usageDesc': 'These reports are generated from your uploaded data and are intended for internal analysis, accountant review, or formal disputes with payment providers. All amounts are shown in EUR. For multi-currency reports, ensure your bank accounts are configured in Setup.',
    'dashboardSummary': 'Dashboard Summary Report',
    'dashboardSummaryDesc': 'Key metrics, totals, and period-over-period changes across all stores.',
    'profitability': 'Profitability Report',
    'profitabilityDesc': 'Revenue, provider fees, operating costs, and net margin per store.',
    'mismatch': 'Mismatch & Discrepancy Report',
    'mismatchDesc': 'All unmatched transactions, missing payouts, and fee discrepancies with status tracking.',
    'fees': 'Fee Analysis by Provider & Card',
    'feesDesc': 'Breakdown of fees per provider, card type, transaction count, and payout timing.',
    'reconciliation': 'Bank Reconciliation Detail',
    'reconciliationDesc': 'Line-by-line matching between bank statements and provider reports per store and bank account.',
    'health': 'Provider Health Scorecard',
    'healthDesc': 'Weighted fee analysis, payout speed risk, and health indicators per provider for negotiation insights.'
}

with open('en.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('en.json updated')
