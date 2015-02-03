require 'spec_helper'
# require './plugins//discourse-plugin-maptopic/spec/map_topic_spec_helper'
# require File.dirname(__FILE__) + '/../spec_helper'

describe 'DiscourseSite' do
  setup do
    # FakeWeb.register_uri('http://github.com/api/v1/json/defunkt', :response => File.join(File.dirname(__FILE__), 'fixtures', 'user.json'))
    # @user = GitHubParty.user('defunkt')
    FakeWeb.allow_net_connect = true
  end
  # let(:site) { Drive::DiscourseSite.create_from_geo_name 'birmingham', "searched" }
  # let(:location) { create_brum_location() }

  it 'can be created from a url' do
    discourse_site = Drive::DiscourseSite.create_from_url "https://meta.discourse.org"
    # binding.pry
    # topic_geo.bounds_value.should == "birmingham"
    # topic_geo.country_lower.should == "united kingdom"
    # topic_geo.capability.should == "question"
  end


end
