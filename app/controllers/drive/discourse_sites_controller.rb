module Drive
  require 'current_user'

  class DiscourseSitesController < Drive::ApplicationController
    include CurrentUser

    skip_before_filter :verify_authenticity_token
    # not sure why discourse base runs check_xhr but it results in 
    # create returning empty ..
    skip_before_filter :check_xhr, only: [:create]

    layout false
    # before_action :verify_host_param, except: [:get_or_add_site, :get_sites]

    def create
      host = params[:host] || params[:base_url]
      uri = uri_from_url host
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

    def get_sites
      # TODO -  better way of setting visibility
      site_records = Drive::DiscourseSite.where('listed' => true)
      # return render json: site_records.as_json, root: false
      site_serialized = serialize_data(site_records, Drive::SummaryDiscourseSiteSerializer, :root => false)
      return  render_json_dump(site_serialized)

    end

    # def passthrough
    #   path = "/#{params[:target]}.json"
    #   site = site_from_params
    # conn = get_connection host
    #   path = path
    #   pass_through_request site, path
    # end

    def latest
      if params[:category]
        path = "/c/#{params[:category]}.json"
      else
        path = "latest.json"
      end
      site = site_from_params
      # conn = get_connection host
      path = path
      pass_through_request site, path
    end



    def about
      site = site_from_params
      # conn = get_connection host
      path = "/about.json"
      pass_through_request site, path
    end

    def categories
      site = site_from_params
      # conn = get_connection host
      path = "/categories.json"
      pass_through_request site, path
    end


    def topic_details
      unless(params[:slug] && params[:topic_id] )
        return render_json_error 'Incorrect parameters'
      end
      # site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
      site = site_from_params
      # conn = get_connection host

      path = '/t/' + params[:topic_id] + '.json'
      pass_through_request site, path
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

    def site_from_params
      unless(params[:slug])
        return render_json_error "Incorrect parameters"
      end

      site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
      # site = site_record.base_url
    end


    # def remote_site_info conn
    #   about_response = conn.get '/about.json'     # GET http://sushi.com/nigiri/sake.json
    #   rb = about_response.body
    #   if about_response.status == 200
    #     about_json = (JSON.parse about_response.body)['about']
    #     about_json['base_url'] = conn.url_prefix.to_s.downcase
    #     # params[:host]
    #     root_response = conn.get '/'
    #     page = Nokogiri::HTML(root_response.body)
    #     favicon_url = page.css('link[rel="icon"]')[0].attributes['href'].value rescue nil
    #     about_json['favicon_url'] = favicon_url
    #     apple_touch_icon_url = page.css('link[rel="apple-touch-icon"]')[0].attributes['href'].value rescue nil
    #     about_json['apple_touch_icon_url'] = apple_touch_icon_url
    #     return about_json
    #   else
    #     return {"error" => {"message" => "sorry, there has been an error"}}
    #   end
    # end

  end
end
