module Drive
  require 'current_user'

  class StaticController < ::ApplicationController
    include CurrentUser

    # skip_before_filter :verify_authenticity_token
    # # , only: [:enter]

    # skip_before_filter :set_current_user_for_logs
    # skip_before_filter :set_locale
    # skip_before_filter :set_mobile_view
    # skip_before_filter :inject_preview_style
    # skip_before_filter :disable_customization
    # skip_before_filter :block_if_readonly_mode
    # skip_before_filter :authorize_mini_profiler
    # # skip_before_filter :preload_json
    # skip_before_filter :check_xhr


    def micro_forums

      unless request.subdomain.blank?
        redirect_to "/home"
        return
      end

      # discettes = Drive::Discette.all
      # return render json: discettes.as_json, root: false
      render "drive/static/micro_forums"
    end
  end
end
