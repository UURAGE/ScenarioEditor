// © DialogueTrainer

(function()
{
    "use strict";

    $.fn.extend(
    {
        tabs: function(optionsOrKey)
        {
            const tabContainer = $(this);

            if (typeof optionsOrKey === 'string')
            {
                let value = null;
                if (!$(this).find('ul').eq(0).hasClass('tabs'))
                {
                    console.error('tabs not initiated on jQuery element');
                    return value;
                }
                switch (optionsOrKey)
                {
                    case 'active':
                        value = $(this).find('ul > li.selected').index();
                        break;
                    default:
                        break;
                }
                return value;
            }

            const options = optionsOrKey ?? tabContainer.data('tabs');
            const tabsContainer = $(this).find('ul').eq(0).addClass('tabs');
            const tabContents = [];

            const tabs = tabsContainer.find('a[href]');

            tabs.each(function()
            {
                const tabLink = $(this);
                const tabContent = tabContainer.find(`div${tabLink.attr('href')}`);

                if (tabContent.length === 0)
                {
                    console.error("Tab has no content");
                    return;
                }

                tabContents.push(tabContent);
                tabContent.hide();

                tabLink.off('click').on('click', function(event)
                {
                    event.preventDefault();

                    const clickedTab = tabLink.parent('li');

                    if (options?.collapsible && clickedTab.hasClass('selected'))
                    {
                        clickedTab.removeClass('selected');
                        tabContent.hide();
                        return;
                    }

                    tabContents.forEach(tabContent => { tabContent.hide(); });
                    tabContent.show();

                    tabs.parent('li').removeClass('selected');
                    clickedTab.addClass('selected');

                    if (options?.activate) options.activate(tabContent);
                });
            });

            tabContainer.data('tabs', options);
            const activeTab = tabs.eq(options?.active ?? 0);
            (activeTab.length > 0 ? activeTab : tabs.first()).trigger('click');
        }
    });
})();
