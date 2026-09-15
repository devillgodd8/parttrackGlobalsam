/**
 * PartTrack 5-Point Shipment Tracking Controller
 * Global SAM Auto
 */

(function() {
  var API_KEY = 'pt_live_4703f0e5f527084b90b7c841317e7cd5b6ce8ac785d22474';
  var API_BASE = '/api/v1/track/';
  var MILESTONES = ['Processing', 'Pickup', 'In Transit', 'Out for Delivery', 'Delivered'];

  function getStepIndex(status) {
    if (!status) return 0;
    var s = status.toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'out for delivery') return 3;
    if (s === 'in transit' || s === 'delayed' || s === 'on hold') return 2;
    if (s === 'picked up' || s === 'pickup') return 1;
    return 0;
  }

  window.trackConsignment = async function(customNum) {
    var input = document.getElementById('pt-input');
    var resDiv = document.getElementById('pt-result');
    var btn = document.getElementById('pt-btn');

    var num = customNum || (input ? input.value.trim() : '');
    if (!num) {
      if (resDiv) {
        resDiv.innerHTML = '<div style="padding:12px;color:#ef4444;background:rgba(239,68,68,0.1);border-radius:8px;font-size:13px;">Please enter your 12-digit tracking number.</div>';
      } else {
        alert('Please enter your tracking number.');
      }
      return;
    }

    if (input) input.value = num;
    if (resDiv) {
      resDiv.innerHTML = '<div style="padding:16px;text-align:center;color:var(--pt-muted);font-size:14px;"><i class="fa fa-spinner fa-spin" style="margin-right:8px;"></i>Searching logistics ledger...</div>';
    }

    try {
      var res = await fetch(API_BASE + encodeURIComponent(num), {
        headers: { 'X-API-Key': API_KEY }
      });
      var json = await res.json();
      if (!res.ok || !json.success) {
        if (resDiv) {
          resDiv.innerHTML = '<div style="padding:14px;color:#ef4444;background:rgba(239,68,68,0.1);border-radius:10px;font-size:13px;border:1px solid rgba(239,68,68,0.2);">' + (json.error || 'Tracking record not found') + '</div>';
        }
        return;
      }

      var d = json.data;
      var activeStep = getStepIndex(d.current_status);
      var fillPct = (activeStep / 4) * 100;

      // Build 5 points HTML
      var stepsHtml = '';
      for (var i = 0; i < MILESTONES.length; i++) {
        var isCompleted = i < activeStep;
        var isActive = i === activeStep;
        var cls = isCompleted ? 'completed' : (isActive ? 'active' : '');
        var checkIcon = isCompleted || (isActive && activeStep === 4) ? '&#10003;' : (i + 1);
        stepsHtml += '<div class="pt-step">' +
          '<div class="pt-node ' + cls + '">' + checkIcon + '</div>' +
          '<div class="pt-label ' + cls + '">' + MILESTONES[i] + '</div>' +
        '</div>';
      }

      var formattedDate = d.estimated_delivery_date 
        ? new Date(d.estimated_delivery_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : 'Pending Confirmation';

      if (resDiv) {
        resDiv.innerHTML =
          '<div style="margin-top:16px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;background:#f8fafc;padding:12px 16px;border-radius:12px;border:1px solid #e2e8f0;">' +
              '<div>' +
                '<span style="font-size:11px;color:var(--pt-muted);text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Current Milestone</span>' +
                '<div style="font-size:17px;font-weight:800;color:var(--pt-accent);display:flex;align-items:center;gap:6px;">' +
                  '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;"></span>' +
                  d.current_status +
                '</div>' +
              '</div>' +
              '<div style="text-align:right;">' +
                '<span style="font-size:11px;color:var(--pt-muted);text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Est. Delivery</span>' +
                '<div style="font-size:14px;font-weight:700;color:#0f172a;">' + formattedDate + '</div>' +
              '</div>' +
            '</div>' +

            '<div class="pt-stepper">' +
              '<div class="pt-track-bg"></div>' +
              '<div class="pt-track-fill" style="width: calc(' + fillPct + '% * 0.9);"></div>' +
              '<div class="pt-steps">' + stepsHtml + '</div>' +
            '</div>' +

            '<div class="pt-details">' +
              '<div class="pt-grid">' +
                '<div><div class="pt-item-label">Part Item</div><div class="pt-item-val">' + (d.part_type || 'Automotive Component') + '</div></div>' +
                '<div><div class="pt-item-label">Vehicle Fitment</div><div class="pt-item-val">' + (d.vehicle ? (d.vehicle.year + ' ' + d.vehicle.make + ' ' + d.vehicle.model) : 'OEM Fitment') + '</div></div>' +
                '<div><div class="pt-item-label">Origin Terminal</div><div class="pt-item-val">' + (d.shipment && d.shipment.origin ? d.shipment.origin : 'Logistics Hub') + '</div></div>' +
                '<div><div class="pt-item-label">Destination Address</div><div class="pt-item-val">' + (d.shipment && d.shipment.destination ? d.shipment.destination : 'Delivery Location') + '</div></div>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
    } catch (err) {
      if (resDiv) {
        resDiv.innerHTML = '<div style="padding:14px;color:#ef4444;background:rgba(239,68,68,0.1);border-radius:10px;font-size:13px;">Network connection error. Please try again.</div>';
      }
    }
  };

  // Modal Control Functions
  window.openTrackModal = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    var modal = document.getElementById('ptModalOverlay');
    if (!modal) return;
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    var input = document.getElementById('pt-input');
    if (input) {
      setTimeout(function() { input.focus(); }, 150);
    }
  };

  window.closeTrackModal = function() {
    var modal = document.getElementById('ptModalOverlay');
    if (!modal) return;
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  };

  // Bind key and click handlers once DOM is ready
  function initTrackWidget() {
    var btn = document.getElementById('pt-btn');
    var input = document.getElementById('pt-input');

    if (btn) {
      btn.addEventListener('click', function() {
        window.trackConsignment();
      });
    }

    if (input) {
      input.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          window.trackConsignment();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', function(ev) {
      if (ev.key === 'Escape') {
        window.closeTrackModal();
      }
    });

    // Check URL parameters for auto-track (e.g. ?tracking=241190101721)
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var trackingParam = urlParams.get('track') || urlParams.get('tracking');
      if (trackingParam) {
        if (input) input.value = trackingParam;
        window.trackConsignment(trackingParam);
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackWidget);
  } else {
    initTrackWidget();
  }
})();
