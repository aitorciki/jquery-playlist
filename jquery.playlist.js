/*
 * Copyright (c) 2009 Aitor Guevara Escalante
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


(function($) {

    $.parserM3U = function(list) {
        this.parse = function() {
            //TODO: in some cases an empty string is matched, why?
            m = list.match(/^(?!#)(?!\s).*$/mg);
            urls = $.grep(m, function(n, i) {
                return (n != '');
            });
            return urls;
        }
    };

    $.playlistOptions = {
        proxy: null,
        parsers: {
            m3u: $.parserM3U
        },
        navArrows: false,
        navArrowsPath: ''
    };

    var fileExtension = function(url) {
        m = url.match(/\w*?(?=#)|\w*?(?=\?)|\w*$/);
        return m[0];
    }

    var createNavArrows = function(player) {
        var ids = ['left', 'right'];
        var arrows = new Array();
        for (i in ids) {
            var arrow = new Image();
            var pos = ids[i];
            var src = $.playlistOptions.navArrowsPath + pos + '.png';
            var id = 'playlist_arrow_' + pos;
            $(arrow).attr('src', src);
            $(arrow).attr('id', id);
            $(arrow).hide();
            $('body').append($(arrow));
            arrows.push($(arrow));
        }
        return arrows;
    }

    var positionNavArrow = function(arrow, pos, player) {
        //In Webkit browsers the positioning fails if no height and
        //width have been set for the player.
        var atop = (player.height() / 2) + (player.position().top) - (arrow.height() / 2);
        if (pos == 'left') {
            var aleft = player.position().left + 10;
        } else {
            var aleft = player.position().left + player.width() - arrow.width() - 10;
        }
        arrow.css('position', 'absolute');
        arrow.css('top', atop);
        arrow.css('left', aleft);
    }

    var disableNavArrow = function(arrow) {
        arrow.hide()
        arrow.css('visibility', 'hidden');
    }

    var enableNavArrow = function(arrow) {
        arrow.css('visibility', 'visible');
    }

    $.fn.playlistParser = function(settings) {

        $.extend($.playlistOptions, settings);

        var plExtensions = new Array();
        for (ext in $.playlistOptions.parsers) {
            plExtensions.push(ext);
        }

        return this.each(function() {
            var player = this;
            var src = player.currentSrc;
            var extension = fileExtension(src);
            var playlist = new Array();
            var current = -1;
            var leftArrow = null;
            var rightArrow = null;

            if ($.inArray(extension, plExtensions) < 0) return;

            var playFollowing = function(reverse) {
                if (reverse) {
                    current--;
                } else {
                    current++;
                }
                if ($.playlistOptions.navArrows) {
                    if (current == 0) {
                        disableNavArrow($(leftArrow));
                    } else {
                        enableNavArrow($(leftArrow));
                    }
                    if (current == playlist.length - 1) {
                        disableNavArrow($(rightArrow));
                    } else {
                        enableNavArrow($(rightArrow));
                    }
                }
                var nextUrl = playlist[current];
                player.src = nextUrl;
                player.load();
            }

            if ($.playlistOptions.navArrows) {
                var arrows = createNavArrows($(player));
                leftArrow = arrows[0];
                rightArrow = arrows[1];
                $(leftArrow).bind('click', function(e) {
                    playFollowing(true);
                });
                $(rightArrow).bind('click', function(e) {
                    playFollowing();
                });
                // Seems that Webkit browsers defer the images size parsing.
                // Since positioning them needs the size, we wait until this
                // information is available.
                $(window).load(function() {
                    positionNavArrow(leftArrow, 'left', $(player));
                    positionNavArrow(rightArrow, 'right', $(player));
                });
                $(leftArrow).bind('mouseover', function(e) {
                    $(this).show();
                });
                $(rightArrow).bind('mouseover', function(e) {
                    $(this).show();
                });
                $(player).bind('mouseover', function(e) {
                    leftArrow.show();
                    rightArrow.show();
                });
                $(player).bind('mouseout', function(e) {
                    leftArrow.hide();
                    rightArrow.hide();
                });
            }

            if ($.playlistOptions.proxy) {
                ajax_url = $.playlistOptions.proxy;
                ajax_options = {url: src};
            } else {
                ajax_url = src;
                ajax_options = null;
            }

            $.get(ajax_url, ajax_options, function(data) {
                var parser = new $.playlistOptions.parsers[extension](data);
                playlist = parser.parse();
                // Playlist emulation, each time a file has ended playing
                // let's play the next one in the list.
                if (playlist.length > 0) {
                    $(player).bind('ended', function(e) {
                        playFollowing();
                    });
                }
                playFollowing();
            });

        });
    };

})(jQuery);
