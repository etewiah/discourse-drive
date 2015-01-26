module Drive
  class ApplicationController < ::ApplicationController
    # ActionController::Base

    private

    def ensure_admin
      render_json_error(current_user) unless current_user.admin?    
      # raise Discourse::InvalidAccess.new unless current_user.admin?
    end


  end
end
