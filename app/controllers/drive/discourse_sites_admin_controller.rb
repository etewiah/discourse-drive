module Drive
  require 'current_user'

  class DiscourseSitesAdminController < Drive::ApplicationController
    include CurrentUser

    layout false

    skip_before_filter :verify_authenticity_token, only: [:enter]

    skip_before_filter :set_current_user_for_logs
    skip_before_filter :set_locale
    skip_before_filter :set_mobile_view
    skip_before_filter :inject_preview_style
    skip_before_filter :disable_customization
    skip_before_filter :block_if_readonly_mode
    skip_before_filter :authorize_mini_profiler
    skip_before_filter :preload_json
    skip_before_filter :check_xhr
    # skip_before_filter :redirect_to_login_if_required


    before_filter :ensure_admin
    # , only: [:destroy]

    def show
      site = Drive::DiscourseSite.find(params[:id])
      site_serialized = serialize_data(site, Drive::AdminDiscourseSiteSerializer, :root => false)
      return  render_json_dump(site_serialized)
      # return render json: site.as_json
    end

    def destroy
      site = Drive::DiscourseSite.find(params[:id])
      if site.destroy!
        render json: { success: 'OK' }
      else
        return render_json_error('Error deleting site')
      end
    end

    def update
      site = Drive::DiscourseSite.find(params[:id])
      site.display_name = params[:display_name]
      site.slug = params[:slug]
      site.description = params[:description]
      if params[:base_url] 
        site.base_url = params[:base_url]
      end
      if params[:is_listed] && params[:is_listed] == "false"
        site.listed = false
      else
        site.listed = true
      end
      if site.save!
        render json: site.as_json
      else
        return render_json_error('Error updating site')
      end
    end




    def create
      uri = uri_from_url params[:host]
      unless uri
        return render_json_error "Invalid Url"
      end
      site_record = Drive::DiscourseSite.get_from_uri uri
      unless site_record
        site_record = Drive::DiscourseSite.create_from_uri uri
      end
      if site_record
        return render json: site_record.as_json, root: false
      else
        return render_json_error "Unable to retrieve Discourse Site at this url"
      end
    end

    def all
      site_records = Drive::DiscourseSite.all
      # return render json: site_records.as_json, root: false
      site_serialized = serialize_data(site_records, Drive::AdminDiscourseSiteSerializer, :root => false)
      return  render_json_dump(site_serialized)

    end

    # def passthrough
    #   path = "/#{params[:target]}.json"
    #   host = host_from_params
    #   conn = get_connection host
    #   path = path
    #   pass_through_request conn, path
    # end

    def latest
      if params[:category]
        path = "/c/#{params[:category]}.json"
      else
        path = "latest.json"
      end
      host = host_from_params
      conn = get_connection host
      path = path
      pass_through_request conn, path
    end



    def about
      host = host_from_params
      conn = get_connection host
      path = "/about.json"
      pass_through_request conn, path
    end

    def categories
      host = host_from_params
      conn = get_connection host
      path = "/categories.json"
      pass_through_request conn, path
    end


    def topic_details
      unless(params[:slug] && params[:topic_id] )
        return render_json_error 'Incorrect parameters'
      end
      # site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
      host = host_from_params
      conn = get_connection host

      path = '/t/' + params[:topic_id] + '.json'
      pass_through_request conn, path
    end

    private

    def uri_from_url param
      uri = URI.parse(param)
      if (uri && uri.host)
        return uri
      else
        return nil
      end
    end

    def host_from_params
      unless(params[:slug])
        return render_json_error "Incorrect parameters"
      end

      site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
      host = site_record.base_url
    end


    def remote_site_info conn
      about_response = conn.get '/about.json'     # GET http://sushi.com/nigiri/sake.json
      rb = about_response.body
      if about_response.status == 200
        about_json = (JSON.parse about_response.body)['about']
        about_json['host_url'] = conn.url_prefix.to_s.downcase
        # params[:host]
        root_response = conn.get '/'
        page = Nokogiri::HTML(root_response.body)
        favicon_url = page.css('link[rel="icon"]')[0].attributes['href'].value rescue nil
        about_json['favicon_url'] = favicon_url
        apple_touch_icon_url = page.css('link[rel="apple-touch-icon"]')[0].attributes['href'].value rescue nil
        about_json['apple_touch_icon_url'] = apple_touch_icon_url
        return about_json
      else
        return {"error" => {"message" => "sorry, there has been an error"}}
      end
    end

  end
end
