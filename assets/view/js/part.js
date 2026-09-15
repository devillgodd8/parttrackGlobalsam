// Wait for both jQuery and DOM to be ready
$(document).ready(function () {
    console.log('jQuery ready - part.js loaded');

    // Real-time checkbox validation clearing for quote form
    $('#quoteSmsConsent').on('change', function () {
        if ($(this).is(':checked')) {
            $('#quoteSmsConsentError').hide();
            $(this).css('outline', 'none');
        }
    });

    $('#quoteTermsConsent').on('change', function () {
        if ($(this).is(':checked')) {
            $('#quoteTermsConsentError').hide();
            $(this).css('outline', 'none');
        }
    });

    // Form visual feedback functionality
    $('#model').change(function () {
        $('.model-f').css('border-bottom', '1px solid #ccc');
    });

    $('#part_name').change(function () {
        // Add styling for part selection if needed
    });

    $('#year').change(function () {
        $('.year-f').css('border-bottom', '1px solid #ccc');
    });

    // Initialize counters after a short delay to ensure all elements are loaded
    setTimeout(function () {
        initializeCounters();
    }, 500);
});

// Enhanced counter function with better error handling
function countUp(element, target, duration, suffix) {
    if (!element) {
        console.error('Counter element not found');
        return;
    }

    console.log(`Starting counter for ${element.id} - Target: ${target}, Suffix: ${suffix}`);

    let current = 0;
    const startTime = Date.now();
    const increment = target / (duration / 16); // Assuming 60fps

    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easing function for smoother animation
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        current = target * easeOutQuad;

        let formattedNumber;
        if (suffix === 'k') {
            // For numbers in thousands (e.g., 40k)
            formattedNumber = Math.round(current / 1000) + "k";
        } else if (suffix === '+') {
            // For numbers with "+" (e.g., 50,000+)
            formattedNumber = Math.round(current).toLocaleString() + "+";
        } else if (suffix === 'over') {
            // For numbers with "Over" (e.g., Over 40)
            formattedNumber = "Over " + Math.round(current);
        } else {
            // Default display with comma formatting
            formattedNumber = Math.round(current).toLocaleString();
        }

        element.textContent = formattedNumber;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            console.log(`Counter animation completed for ${element.id}`);
        }
    }

    requestAnimationFrame(animate);
}

// Intersection Observer callback
function onIntersection(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            console.log('Element is intersecting:', entry.target.id);

            const h2Element = entry.target.querySelector('h2');

            if (!h2Element) {
                console.error('h2 element not found in', entry.target);
                return;
            }

            const targetId = h2Element.id;
            console.log('Starting animation for counter:', targetId);

            switch (targetId) {
                case 'engine-sale':
                    countUp(h2Element, 40000, 2500, 'k');  // 40k Engines Sale
                    break;
                case 'satisfied-customers':
                    countUp(h2Element, 50000, 2500, '+');  // 50,000+ Satisfied Customers
                    break;
                case 'million-parts':
                    countUp(h2Element, 40, 2500, 'over');  // Over 40 Million Used OEM Parts
                    break;
                case 'inventory-yards':
                    countUp(h2Element, 2000, 2500, '+');  // 2,000+ Inventory Yards
                    break;
                default:
                    console.warn('Unknown counter ID:', targetId);
            }

            entry.target.classList.add('counted');
            observer.unobserve(entry.target);
        }
    });
}

// Initialize counters with multiple fallback strategies
function initializeCounters() {
    console.log('Initializing counters...');

    // First, check if all required elements exist
    const counterDivs = [
        'engine-sale-div',
        'satisfied-customers-div',
        'million-parts-div',
        'inventory-yards-div'
    ];

    let allElementsFound = true;
    counterDivs.forEach(divId => {
        const element = document.getElementById(divId);
        if (!element) {
            console.error('Counter div not found:', divId);
            allElementsFound = false;
        } else {
            const h2 = element.querySelector('h2');
            if (!h2) {
                console.error('h2 element not found in:', divId);
                allElementsFound = false;
            } else {
                console.log('Found counter element:', divId, 'with h2 id:', h2.id);
            }
        }
    });

    if (!allElementsFound) {
        console.warn('Not all counter elements found, trying fallback method');
        // Try again after a longer delay
        setTimeout(initializeCounters, 1000);
        return;
    }

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
        console.warn('Intersection Observer not supported, using immediate animation');
        triggerCountersImmediately();
        return;
    }

    const options = {
        root: null,
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(onIntersection, options);

    counterDivs.forEach(divId => {
        const element = document.getElementById(divId);
        if (element) {
            observer.observe(element);
            console.log('Now observing:', divId);
        }
    });

    // Fallback: if user hasn't scrolled to counters within 10 seconds, trigger them
    setTimeout(() => {
        const unCounted = counterDivs.filter(divId => {
            const element = document.getElementById(divId);
            return element && !element.classList.contains('counted');
        });

        if (unCounted.length > 0) {
            console.log('Triggering counters due to timeout:', unCounted);
            triggerCountersImmediately();
        }
    }, 10000);
}

// Fallback function to trigger counters immediately
function triggerCountersImmediately() {
    console.log('Triggering counters immediately');

    const counterConfigs = {
        'engine-sale-div': { target: 40000, suffix: 'k' },
        'satisfied-customers-div': { target: 50000, suffix: '+' },
        'million-parts-div': { target: 40, suffix: 'over' },
        'inventory-yards-div': { target: 2000, suffix: '+' }
    };

    Object.keys(counterConfigs).forEach(divId => {
        const div = document.getElementById(divId);
        const h2 = div ? div.querySelector('h2') : null;

        if (h2 && !div.classList.contains('counted')) {
            const config = counterConfigs[divId];
            countUp(h2, config.target, 2500, config.suffix);
            div.classList.add('counted');
        }
    });
}

// Initialize when DOM is ready with multiple strategies
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded fired');
    setTimeout(initializeCounters, 100);
});

// Additional fallback for when DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCounters);
} else {
    console.log('DOM already loaded, initializing immediately');
    setTimeout(initializeCounters, 100);
}

// Global function to manually trigger counters (for debugging)
window.debugCounters = function () {
    console.log('Manual counter trigger');
    triggerCountersImmediately();
};

// Counter animations are now implemented directly in the HTML file

$('#regForm select').click(function () {
    var selectId = $(this).attr('id');

    // Updated validation logic to match the actual form structure
    if (selectId === 'part_name') {
        let model = $("#model").val();
        if (model === "") {
            $('.model-f').css('border-bottom', '1px solid red');
        }
    } else if (selectId === 'year') {
        let model = $("#model").val();
        if (model === "") {
            $('.model-f').css('border-bottom', '1px solid red');
        }
    }
});

// Form submission handler
$('#regForm').on('submit', function (e) {
    e.preventDefault(); // Prevent default form submission

    // Show loader
    $('#loader').show();

    // Get form data
    var formData = {
        year: $('#year').val(),
        model: $('#model').val(),
        part_name: $('#part_name').val(),
        purchase: $('#purchase').val(),
        vin: $('input[name="vin"]').val(),
        name: $('input[name="name"]').val(),
        email: $('input[name="email"]').val(),
        mobile: $('input[name="mobile"]').val(),
        zip_code: $('input[name="zip_code"]').val(),
        comment: $('input[name="comment"]').val()
    };

    // Validate required fields
    var isValid = true;
    var errorMessage = '';

    if (!formData.year) {
        isValid = false;
        errorMessage += 'Year is required.\n';
        $('.year-f').css('border-bottom', '2px solid red');
    }

    if (!formData.model) {
        isValid = false;
        errorMessage += 'Car model is required.\n';
        $('.model-f').css('border-bottom', '2px solid red');
    }

    if (!formData.part_name) {
        isValid = false;
        errorMessage += 'Part name is required.\n';
        $('#part_name').closest('.input-field').css('border-bottom', '2px solid red');
    }

    if (!formData.name) {
        isValid = false;
        errorMessage += 'Name is required.\n';
        $('input[name="name"]').closest('.input-field').css('border-bottom', '2px solid red');
    }

    if (!formData.email) {
        isValid = false;
        errorMessage += 'Email is required.\n';
        $('input[name="email"]').closest('.input-field').css('border-bottom', '2px solid red');
    }

    if (!formData.mobile) {
        isValid = false;
        errorMessage += 'Contact number is required.\n';
        $('input[name="mobile"]').closest('.input-field').css('border-bottom', '2px solid red');
    }

    if (!formData.zip_code) {
        isValid = false;
        errorMessage += 'ZIP Code is required.\n';
        $('input[name="zip_code"]').closest('.input-field').css('border-bottom', '2px solid red');
    }

    // SMS consent validation
    if (!$('#quoteSmsConsent').is(':checked')) {
        $('#quoteSmsConsentError').show();
        $('#quoteSmsConsent').css('outline', '2px solid #d9232d');
        isValid = false;
        errorMessage += 'Please agree to receive SMS messages to proceed.\n';
    } else {
        $('#quoteSmsConsentError').hide();
        $('#quoteSmsConsent').css('outline', '');
    }

    // Terms consent validation
    if (!$('#quoteTermsConsent').is(':checked')) {
        $('#quoteTermsConsentError').show();
        $('#quoteTermsConsent').css('outline', '2px solid #d9232d');
        isValid = false;
        errorMessage += 'Please accept the Terms of Service and Privacy Policy to proceed.\n';
    } else {
        $('#quoteTermsConsentError').hide();
        $('#quoteTermsConsent').css('outline', '');
    }

    // Scroll to first unchecked checkbox if any checkbox validation failed
    if (!$('#quoteSmsConsent').is(':checked') || !$('#quoteTermsConsent').is(':checked')) {
        var scrollTarget = !$('#quoteSmsConsent').is(':checked') ? '#quoteSmsConsent' : '#quoteTermsConsent';
        $('html, body').animate({
            scrollTop: $(scrollTarget).offset().top - 150
        }, 500);
    }

    if (!isValid) {
        $('#loader').hide();
        alert(errorMessage);
        return false;
    }

    // Set consent values
    $('#quoteSmsConsentValue').val($('#quoteSmsConsent').is(':checked') ? 'Yes' : 'No');
    $('#quoteTermsConsentValue').val($('#quoteTermsConsent').is(':checked') ? 'Yes' : 'No');

    // Add consent values to formData
    formData.smsConsent = $('#quoteSmsConsent').is(':checked') ? 'Yes' : 'No';
    formData.termsConsent = $('#quoteTermsConsent').is(':checked') ? 'Yes' : 'No';

    // Create email content in table format
    var emailSubject = 'New Auto Parts Quote Request - ' + formData.name;
    var emailBody = createEmailTableContent(formData);

    // Send email using EmailJS or alternative service
    sendEmail(formData, emailSubject, emailBody);
});

// Function to create HTML table format for email
function createEmailTableContent(data) {
    var currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    var tableHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #04003f; color: white; padding: 20px; text-align: center;">
                <h2>New Auto Parts Quote Request</h2>
                <p>Submitted on: ${currentDate}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #ddd;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Field</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8f9fa; font-weight: bold;">Customer Name</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${data.name || 'Not provided'}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8f9fa; font-weight: bold;">Email Address</td>
                        <td style="border: 1px solid #ddd; padding: 12px;"><a href="mailto:${data.email}">${data.email || 'Not provided'}</a></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8f9fa; font-weight: bold;">Contact Number</td>
                        <td style="border: 1px solid #ddd; padding: 12px;"><a href="tel:${data.mobile}">${data.mobile || 'Not provided'}</a></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8f9fa; font-weight: bold;">ZIP Code</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${data.zip_code || 'Not provided'}</td>
                    </tr>
                    <tr style="background-color: #e3f2fd;">
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #1976d2; color: white; font-weight: bold;">Vehicle Year</td>
                        <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${data.year || 'Not provided'}</td>
                    </tr>
                    <tr style="background-color: #e3f2fd;">
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #1976d2; color: white; font-weight: bold;">Vehicle Model</td>
                        <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${data.model || 'Not provided'}</td>
                    </tr>
                    <tr style="background-color: #e3f2fd;">
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #1976d2; color: white; font-weight: bold;">Part Needed</td>
                        <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${data.part_name || 'Not provided'}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8f9fa; font-weight: bold;">Purchase Timeline</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${data.purchase || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8f9fa; font-weight: bold;">Vehicle VIN</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${data.vin || 'Not provided'}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8f9fa; font-weight: bold;">Additional Comments</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${data.comment || 'No additional comments'}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="background-color: #f8f9fa; padding: 15px; margin-top: 20px; text-align: center;">
                <p><strong>Next Steps:</strong></p>
                <p>Please contact the customer within 24 hours with a quote and availability information.</p>
                <p style="color: #666; font-size: 12px;">This email was automatically generated from the reveraforteauto.com quote request form.</p>
            </div>
        </div>
    `;

    return tableHtml;
}

// Function to send email (using a simple mailto approach for static sites)
function sendEmail(formData, subject, body) {
    // For a static website, we'll use a combination of approaches

    // Method 1: Try using EmailJS if configured
    if (typeof emailjs !== 'undefined') {
        // EmailJS configuration - you would need to set this up
        emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
            to_email: 'info@globalsamauto.com',
            subject: subject,
            message: body,
            from_name: formData.name,
            from_email: formData.email,
            reply_to: formData.email
        }).then(function (response) {
            $('#loader').hide();
            showSuccessMessage();
        }, function (error) {
            console.log('EmailJS error:', error);
            fallbackEmailMethod(formData, subject, body);
        });
    } else {
        // Fallback method
        fallbackEmailMethod(formData, subject, body);
    }
}

// Fallback email method using AJAX to send data to server-side script
function fallbackEmailMethod(formData, subject, body) {
    // Send form data via AJAX to PHP script
    $.ajax({
        url: 'send_email.php',
        type: 'POST',
        data: {
            year: formData.year,
            model: formData.model,
            part_name: formData.part_name,
            purchase: formData.purchase,
            vin: formData.vin,
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            zip_code: formData.zip_code,
            comment: formData.comment,
            email_subject: subject,
            email_body: body,
            to_email: 'info@globalsamauto.com'
        },
        timeout: 30000, // 30 second timeout
        success: function (response) {
            $('#loader').hide();
            try {
                var result = JSON.parse(response);
                if (result.success) {
                    showSuccessMessage();
                } else {
                    showErrorMessage('Failed to send email: ' + (result.error || 'Unknown error'));
                }
            } catch (e) {
                // If response is not JSON, check if it contains success indicators
                if (response.toLowerCase().includes('success') || response.toLowerCase().includes('sent')) {
                    showSuccessMessage();
                } else {
                    showErrorMessage('Email sent but received unexpected response format.');
                }
            }
        },
        error: function (xhr, status, error) {
            $('#loader').hide();
            var errorMsg = 'Failed to send email. ';

            if (status === 'timeout') {
                errorMsg += 'Request timed out. Please try again.';
            } else if (xhr.status === 0) {
                errorMsg += 'Network connection error. Please check your connection.';
            } else if (xhr.status === 404) {
                errorMsg += 'Email service not found. Please contact support.';
            } else if (xhr.status >= 500) {
                errorMsg += 'Server error. Please try again later.';
            } else {
                errorMsg += 'Error: ' + error;
            }

            showErrorMessage(errorMsg);
        }
    });
}

// Function to show success message
function showSuccessMessage() {
    // Reset form
    $('#regForm')[0].reset();

    // Reset field styling
    $('.input-field').css('border-bottom', '1px solid #ccc');
    $('.year-f').css('border-bottom', '1px solid #ccc');
    $('.model-f').css('border-bottom', '1px solid #ccc');

    // Show success message
    var successHtml = `
        <div class="success-message" style="background-color: #d4edda; color: #155724; padding: 20px; border: 1px solid #c3e6cb; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3>🎉 Thank You for Your Request!</h3>
            <p><strong>Your auto parts quote request has been successfully submitted.</strong></p>
            <p>Our team will review your request and contact you within 24 hours with:</p>
            <ul style="text-align: left; display: inline-block;">
                <li>Available parts matching your requirements</li>
                <li>Competitive pricing information</li>
                <li>Shipping and warranty details</li>
            </ul>
            <p><strong>Need immediate assistance?</strong><br>
            Call us at <a href="tel:+18776118211" style="color: #155724; font-weight: bold;">+1 (307) 302-8308</a></p>
        </div>
    `;

    // Insert success message after the form
    $('#regForm').after(successHtml);

    // Scroll to success message
    $('html, body').animate({
        scrollTop: $('#regForm').offset().top - 50
    }, 1000);

    // Remove success message after 10 seconds
    setTimeout(function () {
        $('.success-message, .error-message').fadeOut(500, function () {
            $(this).remove();
        });
    }, 10000);
}

// Function to show error message
function showErrorMessage(message) {
    // Show error message
    var errorHtml = `
        <div class="error-message" style="background-color: #f8d7da; color: #721c24; padding: 20px; border: 1px solid #f5c6cb; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3>❌ Submission Error</h3>
            <p><strong>We encountered an issue while processing your request.</strong></p>
            <p>${message}</p>
            <p><strong>Please try again or contact us directly:</strong><br>
            Call us at <a href="tel:+18776118211" style="color: #721c24; font-weight: bold;">+1 (307) 302-8308</a><br>
            Email us at <a href="mailto:info@globalsamauto.com" style="color: #721c24; font-weight: bold;">info@globalsamauto.com</a></p>
        </div>
    `;

    // Remove any existing messages first
    $('.success-message, .error-message').remove();

    // Insert error message after the form
    $('#regForm').after(errorHtml);

    // Scroll to error message
    $('html, body').animate({
        scrollTop: $('#regForm').offset().top - 50
    }, 1000);

    // Remove error message after 15 seconds
    setTimeout(function () {
        $('.error-message').fadeOut(500, function () {
            $(this).remove();
        });
    }, 15000);
}

// Clear field styling when user starts typing/selecting
$('#regForm input, #regForm select').on('focus change', function () {
    $(this).closest('.input-field').css('border-bottom', '1px solid #ccc');
});