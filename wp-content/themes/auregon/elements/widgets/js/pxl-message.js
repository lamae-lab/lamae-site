(function ($) {
	$(window).on('elementor/frontend/init', function () {
		elementorFrontend.hooks.addAction('frontend/element_ready/pxl_message.default', function ($scope) {
			var $root = $scope.find('.pxl-message-widget');
			if (!$root.length) return;

			var $slidingContent = $root.find('.sliding-content');
			if (!$slidingContent.length) return;

			var messagesDataAttr = $slidingContent.attr('data-messages');
			if (!messagesDataAttr) return;

			var messages;
			try {
				messages = JSON.parse(messagesDataAttr);
			} catch (e) {
				messages = [];
			}

			if (!messages || !messages.length) return;

			function createMessageHTML(msg) {
				var role = msg.role === 'assistant' ? 'assistant' : 'user';

				var hasImage = msg.image && (msg.image.url || msg.image.id);
				var avatarHtml = '';
				if (role === 'user') {
					if (hasImage && msg.image.url) {
						avatarHtml = '<div class="avatar"><img src="' + msg.image.url + '" alt="" /></div>';
					} else {
						avatarHtml = '<div class="avatar">👤</div>';
					}
				}

				return '' +
					'<div class="message ' + role + '">' +
					'  <div class="message-content">' +
					avatarHtml +
					'    <div class="message-bubble">' +
					'      <p class="message-text">' + (msg.text || '') + '</p>' +
					'    </div>' +
					'  </div>' +
					'</div>';
			}

			var messagesHTML = '<div class="messages-group">';
			messages.forEach(function (msg) {
				messagesHTML += createMessageHTML(msg);
			});
			messagesHTML += '</div>';

			// Duplicate for seamless loop
			messagesHTML += '<div class="messages-group">';
			messages.forEach(function (msg) {
				messagesHTML += createMessageHTML(msg);
			});
			messagesHTML += '</div>';

			$slidingContent.html(messagesHTML);
		});
	});
})(jQuery);


