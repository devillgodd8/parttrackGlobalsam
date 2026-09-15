/**
 * PartTrack Enterprise Consignment Tracking Controller
 * Global SAM Auto - Heavy Freight & Auto Logistics
 */

(function() {
  var API_KEY = 'pt_live_b89f964b3f26ca88d3e7d14abc5f3179010bc8254fe22fd0';
  var REMOTE_API_BASE = 'https://app.reviorcm.com/backend/index.php/api/v1/track/';
  var LOCAL_API_BASE = '/api/v1/track/';

  var MILESTONES = [
    {
      title: 'Order Verified & Manifest Generated',
      note: 'Consignment documentation verified; allocation confirmed at fulfillment depot'
    },
    {
      title: 'Carrier Terminal Scan & Pallet Load',
      note: 'Freight pallet inspected, weighed, and scanned onto regional line-haul transport'
    },
    {
      title: 'In Transit (Line-Haul Freight Transit)',
      note: 'Consignment moving across commercial freight network toward destination hub'
    },
    {
      title: 'Out for Final Delivery',
      note: 'Loaded on local dispatch truck; scheduled for drop-off at receiving address'
    },
    {
      title: 'Delivered & Signed',
      note: 'Shipment delivered to customer receiving address and signature captured'
    }
  ];

  var CHECK_SVG = '<svg class="pt-vnode-svg" viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.431a1 1 0 0 1 1.414 1.414l-8.5 8.5a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L5.685 9.224l7.8-7.793z"/></svg>';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getStepIndex(status) {
    if (!status) return 0;
    var s = status.toLowerCase().trim();
    if (s === 'delivered' || s === 'completed') return 4;
    if (s === 'out for delivery') return 3;
    if (s === 'in transit' || s === 'delayed' || s === 'on hold' || s === 'transit') return 2;
    if (s === 'picked up' || s === 'pickup') return 1;
    return 0;
  }

  function getStatusBadge(currentStatus, activeStep) {
    var s = (currentStatus || '').toLowerCase();
    var statusClass = 'processing';
    var statusLabel = currentStatus || 'Processing';

    if (activeStep === 4 || s === 'delivered') {
      statusClass = 'delivered';
      statusLabel = 'Delivered';
    } else if (activeStep === 3 || s === 'out for delivery') {
      statusClass = 'out-for-delivery';
      statusLabel = 'Out for Delivery';
    } else if (activeStep === 2 || s === 'in transit') {
      statusClass = 'in-transit';
      statusLabel = 'In Transit';
    } else if (activeStep === 1 || s === 'pickup' || s === 'picked up') {
      statusClass = 'pickup';
      statusLabel = 'Carrier Pickup';
    }

    return {
      statusClass: statusClass,
      statusLabel: statusLabel
    };
  }

  function formatShortDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getStepTime(stepIdx, activeStep, estDateObj) {
    if (!estDateObj || isNaN(estDateObj.getTime())) {
      if (stepIdx < activeStep) return 'Completed';
      if (stepIdx === activeStep) return 'In Progress';
      return 'Pending';
    }

    var estMs = estDateObj.getTime();
    var oneDay = 86400000;
    var targetDate;

    if (activeStep === 4) {
      var diffDays = 4 - stepIdx;
      targetDate = new Date(estMs - diffDays * oneDay);
    } else {
      var offsetFromCurrent = stepIdx - activeStep;
      var now = Date.now();
      if (offsetFromCurrent === 0) {
        targetDate = new Date(now);
      } else if (offsetFromCurrent < 0) {
        targetDate = new Date(now + offsetFromCurrent * oneDay);
      } else {
        targetDate = new Date(now + offsetFromCurrent * oneDay);
      }
    }

    var formatted = formatShortDate(targetDate);
    if (stepIdx > activeStep) {
      return 'Est. ' + formatted;
    }
    return formatted;
  }

  window.trackConsignment = async function(customNum) {
    var input = document.getElementById('pt-input');
    var resDiv = document.getElementById('pt-result');

    var rawNum = customNum || (input ? input.value : '');
    var num = (rawNum || '').trim().replace(/[^a-zA-Z0-9]/g, '');

    if (!num || num.length < 6) {
      if (resDiv) {
        resDiv.innerHTML = '<div class="pt-alert pt-alert-error">Please enter a valid consignment tracking number (e.g. 241190101721).</div>';
      } else {
        alert('Please enter a valid consignment tracking number.');
      }
      return;
    }

    if (input) input.value = num;
    if (resDiv) {
      resDiv.innerHTML = '<div class="pt-alert pt-alert-loading"><i class="fa fa-circle-o-notch fa-spin" style="margin-right:8px;"></i>Querying freight dispatch records...</div>';
    }

    var d = null;
    var errorMsg = 'Consignment record not found. Please verify the tracking number and try again.';

    // Try primary remote API first
    try {
      var res = await fetch(REMOTE_API_BASE + encodeURIComponent(num), {
        headers: { 'X-API-Key': API_KEY }
      });
      if (res.ok) {
        var json = await res.json();
        if (json && json.success && json.data) {
          d = json.data;
        } else if (json && json.error) {
          errorMsg = json.error;
        }
      }
    } catch (e) {
      // Remote API unavailable, will attempt local fallback
    }

    // Try local endpoint fallback if remote did not return data
    if (!d) {
      try {
        var localRes = await fetch(LOCAL_API_BASE + encodeURIComponent(num));
        if (localRes.ok) {
          var localJson = await localRes.json();
          if (localJson && localJson.success && localJson.data) {
            d = localJson.data;
          } else if (localJson && localJson.error) {
            errorMsg = localJson.error;
          }
        }
      } catch (e) {
        // Local endpoint unavailable
      }
    }

    if (!d) {
      if (resDiv) {
        resDiv.innerHTML = '<div class="pt-alert pt-alert-error">' + escapeHtml(errorMsg) + '</div>';
      }
      return;
    }

    var activeStep = getStepIndex(d.current_status);
    var badge = getStatusBadge(d.current_status, activeStep);
    var consignmentId = d.tracking_number || num;

    var estDateObj = d.estimated_delivery_date ? new Date(d.estimated_delivery_date) : null;
    var formattedDeliveryDate = (estDateObj && !isNaN(estDateObj.getTime()))
      ? estDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Pending Confirmation';

    var partType = d.part_type || 'Automotive Component Assembly';
    var vehicleFitment = d.vehicle ? (d.vehicle.year + ' ' + d.vehicle.make + ' ' + d.vehicle.model) : 'OEM Vehicle Specification';
    var originTerminal = (d.shipment && d.shipment.origin) ? d.shipment.origin : 'Logistics Fulfillment Hub';
    var destinationHub = (d.shipment && d.shipment.destination) ? d.shipment.destination : 'Customer Delivery Address';

    // Build Vertical 5-Step Timeline HTML
    var stepsHtml = '';
    for (var i = 0; i < MILESTONES.length; i++) {
      var isCompleted = i < activeStep;
      var isActive = i === activeStep;
      var isPending = i > activeStep;
      var isDeliveredStep = i === 4;

      var stepClass = 'pt-vstep';
      if (isCompleted) stepClass += ' completed';
      if (isActive) stepClass += ' active';
      if (isPending) stepClass += ' pending';
      if (isDeliveredStep) stepClass += ' delivered';

      var nodeContent = isCompleted || (isActive && activeStep === 4)
        ? CHECK_SVG
        : (i + 1);

      var tagHtml = '';
      if (isActive) {
        tagHtml = '<span class="pt-vstep-tag">' + (activeStep === 4 ? 'Delivered' : 'Current Milestone') + '</span>';
      } else if (isCompleted) {
        tagHtml = '<span class="pt-vstep-tag">Completed</span>';
      }

      // Location & date are only shown for the final milestone step
      var metaHtml = '';
      if (isDeliveredStep) {
        var timeText = (estDateObj && !isNaN(estDateObj.getTime()))
          ? (activeStep === 4 ? formatShortDate(estDateObj) : 'Est. ' + formatShortDate(estDateObj))
          : '';

        metaHtml = 
          '<div class="pt-vmeta">' +
            '<span><i class="fa fa-map-marker"></i> ' + escapeHtml(destinationHub) + '</span>' +
            (timeText ? '<span><i class="fa fa-calendar-check-o"></i> ' + escapeHtml(timeText) + '</span>' : '') +
          '</div>';
      }

      stepsHtml += 
        '<div class="' + stepClass + '">' +
          '<div class="pt-vmarker-col">' +
            '<div class="pt-vnode">' + nodeContent + '</div>' +
            '<div class="pt-vline"></div>' +
          '</div>' +
          '<div class="pt-vcontent">' +
            '<div class="pt-vrow">' +
              '<div class="pt-vname">' + MILESTONES[i].title + '</div>' +
              tagHtml +
            '</div>' +
            '<div class="pt-vnote">' + MILESTONES[i].note + '</div>' +
            metaHtml +
          '</div>' +
        '</div>';
    }

    if (resDiv) {
      resDiv.innerHTML = 
        '<div class="pt-summary-card">' +
          '<div class="pt-summary-header">' +
            '<div class="pt-consignment-group">' +
              '<span class="pt-meta-label">Consignment Tracking ID</span>' +
              '<span class="pt-consignment-id">' + escapeHtml(consignmentId) + '</span>' +
            '</div>' +
            '<div class="pt-status-badge ' + badge.statusClass + '">' +
              '<span class="pt-badge-dot"></span>' +
              escapeHtml(badge.statusLabel) +
            '</div>' +
          '</div>' +
          '<div class="pt-delivery-row">' +
            '<div>' +
              '<div class="pt-meta-label">Estimated Delivery</div>' +
              '<div class="pt-delivery-val">' + escapeHtml(formattedDeliveryDate) + '</div>' +
            '</div>' +
            '<div class="pt-carrier-route">' +
              '<span>' + escapeHtml(originTerminal.split(',')[0] || 'Origin') + '</span>' +
              '<span class="pt-route-arrow">&rarr;</span>' +
              '<span>' + escapeHtml(destinationHub.split(',')[0] || 'Destination') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="pt-spec-grid">' +
          '<div class="pt-spec-item">' +
            '<div class="pt-spec-label">Part Item Specification</div>' +
            '<div class="pt-spec-val">' + escapeHtml(partType) + '</div>' +
          '</div>' +
          '<div class="pt-spec-item">' +
            '<div class="pt-spec-label">Vehicle Fitment</div>' +
            '<div class="pt-spec-val">' + escapeHtml(vehicleFitment) + '</div>' +
          '</div>' +
          '<div class="pt-spec-item">' +
            '<div class="pt-spec-label">Origin Facility</div>' +
            '<div class="pt-spec-val">' + escapeHtml(originTerminal) + '</div>' +
          '</div>' +
          '<div class="pt-spec-item">' +
            '<div class="pt-spec-label">Destination Address</div>' +
            '<div class="pt-spec-val">' + escapeHtml(destinationHub) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="pt-timeline-title">' +
          '<span>Milestone Verification Log</span>' +
          '<span>5-Point Check</span>' +
        '</div>' +

        '<div class="pt-vtimeline">' +
          stepsHtml +
        '</div>' +

        '<div class="pt-footer-note">' +
          '<span class="pt-verified"><i class="fa fa-check-circle"></i> Verified Freight Dispatch</span>' +
          '<span>Logistics Support: <a href="tel:+18776118211" style="color:var(--pt-text);font-weight:600;text-decoration:none;">+1 (877) 611-8211</a></span>' +
        '</div>';
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
      setTimeout(function() { input.focus(); }, 120);
    }
  };

  window.closeTrackModal = function() {
    var modal = document.getElementById('ptModalOverlay');
    if (!modal) return;
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  };

  // DOM Ready initialization
  function initTrackWidget() {
    var btn = document.getElementById('pt-btn');
    var input = document.getElementById('pt-input');

    if (btn) {
      btn.addEventListener('click', function(ev) {
        ev.preventDefault();
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

    // Check URL parameters for auto-track (e.g. ?tracking=241190101721 or ?track=241190101721)
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
