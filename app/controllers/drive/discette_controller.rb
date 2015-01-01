module Drive
  class DiscetteController < Drive::ApplicationController
    include CurrentUser
    # before_action :get_section_from_subdomain
    # before_filter :preload_drive_data

    # below check seems to redirect to main domain if user not authenticated
    # before_action :ensure_logged_in, only: [:claim_section]

    # end point for routes that are only implemented client side
    # hardly gets hit though...
    # TODO - render useful serverside content for search engine etc..
    def landing
      # binding.pry
      render layout: "drive"
      # subdomain = request.subdomain
      # render json: { status: 'ok', subdomain: subdomain}
      # head 200, content_type: "text/html", layout: "drive"
    end


    def preload_drive_data
      store_preloaded("site", Site.json_for(guardian))
      store_preloaded("siteSettings", SiteSetting.client_settings_json)
      store_preloaded("customHTML", custom_html_json)
      store_preloaded("banner", banner_json)
    end

  end
end
