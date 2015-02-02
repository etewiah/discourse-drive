module Drive
  require 'current_user'

  class PassthroughController < Drive::ApplicationController
    include CurrentUser

    layout false
    # before_action :verify_host_param, except: [:get_or_add_site, :get_sites]

    # def about
    #   host = host_from_params
    #   conn = get_connection host
    #   path = "/about.json"
    #   pass_through_request conn, path
    # end

    # def categories
    #   host = host_from_params
    #   conn = get_connection host
    #   path = "/categories.json"
    #   pass_through_request conn, path
    # end

    # def latest
    #   unless(params[:host] || params[:slug])
    #     return render_json_error "Incorrect parameters"
    #   end

    #   if params[:slug]
    #     site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
    #     host = site_record.base_url
    #   else
    #     # site_record = Drive::DiscourseSite.where(:base_url => params[:host]).first
    #     # host = site_record.base_url
    #     host = params[:host]
    #   end
    #   conn = get_connection host
    #   path = "/latest.json"
    #   pass_through_request conn, path
    # end


    # def topic_details
    #   unless(params[:slug] && params[:topic_id] )
    #     return render_json_error 'Incorrect parameters'
    #   end
    #   site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
    #   host = site_record.base_url

    #   conn = get_connection host

    #   path = '/t/' + params[:topic_id] + '.json'
    #   pass_through_request conn, path
    # end


    private

    # def verify_host_param
    #   unless(params[:host] )
    #     return render json: {"error" => {"message" => "incorrect params"}}
    #   end
    # end

    def host_from_params
      unless(params[:slug])
        return render_json_error "Incorrect parameters"
      end

      site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
      host = site_record.base_url
    end


  end
end
